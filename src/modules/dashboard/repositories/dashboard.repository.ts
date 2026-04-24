import { Repository } from 'typeorm';
import { AppDataSource } from '@infrastructure/database';
import { IpAsset } from '@models/ip-asset.entity';
import { CraftVillage } from '@models/craft-village.entity';
import { AssetType } from '@shared/constants/enums';

export interface ExpiringItem {
  id: string;
  asset_type: string;
  title: string;
  grant_number: string | null;
  expiry_date: Date;
  applicant_name: string | null;
}

export interface TimelinePeriod {
  period: string;
  filed: number;
  granted: number;
}

export class DashboardRepository {
  private assetRepo: Repository<IpAsset>;
  private craftRepo: Repository<CraftVillage>;

  constructor() {
    this.assetRepo = AppDataSource.getRepository(IpAsset);
    this.craftRepo = AppDataSource.getRepository(CraftVillage);
  }

  async countTotal(): Promise<number> {
    return this.assetRepo.createQueryBuilder('a').where('a.deleted_at IS NULL').getCount();
  }

  async countByType(): Promise<Record<string, number>> {
    const rows = await this.assetRepo
      .createQueryBuilder('a')
      .select('a.asset_type', 'type')
      .addSelect('COUNT(*)', 'cnt')
      .where('a.deleted_at IS NULL')
      .groupBy('a.asset_type')
      .getRawMany<{ type: string; cnt: string }>();

    const base = Object.fromEntries(Object.values(AssetType).map((t) => [t, 0]));
    rows.forEach((r) => { base[r.type] = parseInt(r.cnt, 10); });
    return base;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.assetRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('a.deleted_at IS NULL')
      .groupBy('a.status')
      .getRawMany<{ status: string; cnt: string }>();

    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = parseInt(r.cnt, 10);
      return acc;
    }, {});
  }

  async countCraftVillages(): Promise<number> {
    return this.craftRepo.createQueryBuilder('cv').where('cv.deleted_at IS NULL').getCount();
  }

  async findExpiringSoon(daysAhead: number): Promise<ExpiringItem[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    const rows = await this.assetRepo
      .createQueryBuilder('a')
      .select(['a.id', 'a.asset_type', 'a.title', 'a.grant_number', 'a.expiry_date', 'a.applicant_name'])
      .where('a.deleted_at IS NULL')
      .andWhere('a.expiry_date IS NOT NULL')
      .andWhere('a.expiry_date BETWEEN :now AND :future', { now, future })
      .orderBy('a.expiry_date', 'ASC')
      .getMany();

    return rows.map((r) => ({
      id: r.id,
      asset_type: r.asset_type,
      title: r.title,
      grant_number: r.grant_number ?? null,
      expiry_date: r.expiry_date!,
      applicant_name: r.applicant_name ?? null,
    }));
  }

  async getTopApplicants(limit = 10, assetType?: string): Promise<Array<{ applicant_name: string; total: number }>> {
    const qb = this.assetRepo
      .createQueryBuilder('a')
      .select('a.applicant_name', 'applicant_name')
      .addSelect('COUNT(*)', 'total')
      .where('a.deleted_at IS NULL')
      .andWhere('a.applicant_name IS NOT NULL');

    if (assetType) qb.andWhere('a.asset_type = :assetType', { assetType });

    const rows = await qb
      .groupBy('a.applicant_name')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany<{ applicant_name: string; total: string }>();

    return rows.map((r) => ({ applicant_name: r.applicant_name, total: parseInt(r.total, 10) }));
  }

  async getTopGroups(limit = 10): Promise<Array<{ asset_type: string; district_code: string | null; total: number }>> {
    const rows = await this.assetRepo
      .createQueryBuilder('a')
      .select('a.asset_type', 'asset_type')
      .addSelect('a.district_code', 'district_code')
      .addSelect('COUNT(*)', 'total')
      .where('a.deleted_at IS NULL')
      .groupBy('a.asset_type')
      .addGroupBy('a.district_code')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany<{ asset_type: string; district_code: string | null; total: string }>();

    return rows.map((r) => ({ asset_type: r.asset_type, district_code: r.district_code, total: parseInt(r.total, 10) }));
  }

  async getTimeline(
    year: number,
    groupBy: 'month' | 'quarter',
    assetType?: AssetType
  ): Promise<TimelinePeriod[]> {
    const formatExpr =
      groupBy === 'quarter'
        ? `CONCAT(:year, '-Q', QUARTER(a.application_date))`
        : `DATE_FORMAT(a.application_date, '%Y-%m')`;

    const grantFormatExpr =
      groupBy === 'quarter'
        ? `CONCAT(:year, '-Q', QUARTER(a.grant_date))`
        : `DATE_FORMAT(a.grant_date, '%Y-%m')`;

    const baseWhere = `a.deleted_at IS NULL AND YEAR(a.application_date) = :year`;
    const params: Record<string, unknown> = { year };
    if (assetType) params.assetType = assetType;

    // filed count
    const filedQb = this.assetRepo
      .createQueryBuilder('a')
      .select(formatExpr, 'period')
      .addSelect('COUNT(*)', 'filed')
      .where(baseWhere, params)
      .andWhere('a.application_date IS NOT NULL');
    if (assetType) filedQb.andWhere('a.asset_type = :assetType', { assetType });
    filedQb.groupBy('period').orderBy('period', 'ASC');

    // granted count
    const grantedQb = this.assetRepo
      .createQueryBuilder('a')
      .select(grantFormatExpr, 'period')
      .addSelect('COUNT(*)', 'granted')
      .where(`a.deleted_at IS NULL AND YEAR(a.grant_date) = :year`, { year })
      .andWhere('a.grant_date IS NOT NULL');
    if (assetType) grantedQb.andWhere('a.asset_type = :assetType', { assetType });
    grantedQb.groupBy('period').orderBy('period', 'ASC');

    const [filedRows, grantedRows] = await Promise.all([
      filedQb.getRawMany<{ period: string; filed: string }>(),
      grantedQb.getRawMany<{ period: string; granted: string }>(),
    ]);

    // Merge by period
    const map = new Map<string, TimelinePeriod>();
    filedRows.forEach((r) => map.set(r.period, { period: r.period, filed: parseInt(r.filed, 10), granted: 0 }));
    grantedRows.forEach((r) => {
      const existing = map.get(r.period);
      if (existing) {
        existing.granted = parseInt(r.granted, 10);
      } else {
        map.set(r.period, { period: r.period, filed: 0, granted: parseInt(r.granted, 10) });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }
}
