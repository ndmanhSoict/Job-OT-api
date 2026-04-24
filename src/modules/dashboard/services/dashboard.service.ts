import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { AssetType } from '@shared/constants/enums';
import { DashboardRepository } from '../repositories/dashboard.repository';

const MAX_DAYS = 365;
const DEFAULT_DAYS = 90;

export class DashboardService {
  private repo = new DashboardRepository();

  async getStats() {
    const [total, by_type, by_status, craft_villages_total] = await Promise.all([
      this.repo.countTotal(),
      this.repo.countByType(),
      this.repo.countByStatus(),
      this.repo.countCraftVillages(),
    ]);

    return {
      total,
      by_type,
      by_status,
      craft_villages_total,
      updated_at: new Date().toISOString(),
    };
  }

  async getExpiring(days = DEFAULT_DAYS) {
    if (days < 1 || days > MAX_DAYS) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, `days phải từ 1 đến ${MAX_DAYS}`);
    }

    const items = await this.repo.findExpiringSoon(days);
    const now = new Date();

    const data = items.map((item) => ({
      ...item,
      expiry_date: item.expiry_date.toISOString().split('T')[0],
      days_remaining: Math.ceil(
        (item.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return {
      data,
      meta: { total: data.length, days_threshold: days },
    };
  }

  async getTopApplicants(limit = 10, assetType?: string) {
    if (limit < 1 || limit > 50) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'limit phải từ 1 đến 50');
    }
    return this.repo.getTopApplicants(limit, assetType);
  }

  async getTopGroups(limit = 10) {
    if (limit < 1 || limit > 50) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'limit phải từ 1 đến 50');
    }
    return this.repo.getTopGroups(limit);
  }

  async getTimeline(year?: number, groupBy: 'month' | 'quarter' = 'month', assetType?: string) {
    const targetYear = year ?? new Date().getFullYear();

    if (groupBy !== 'month' && groupBy !== 'quarter') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, "groupBy phải là 'month' hoặc 'quarter'");
    }

    const validAssetType = assetType && Object.values(AssetType).includes(assetType as AssetType)
      ? (assetType as AssetType)
      : undefined;

    if (assetType && !validAssetType) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'asset_type không hợp lệ');
    }

    const series = await this.repo.getTimeline(targetYear, groupBy, validAssetType);

    return { year: targetYear, groupBy, series };
  }
}
