import { Repository } from 'typeorm';
import { AppDataSource } from '@infrastructure/database';
import { RefProvince } from '@models/ref-province.entity';
import { RefDistrict } from '@models/ref-district.entity';
import { RefStatus } from '@models/ref-status.entity';
import { RefNiceClass } from '@models/ref-nice-class.entity';
import { RefIpcCode } from '@models/ref-ipc-code.entity';
import { RefLocarnoCode } from '@models/ref-locarno-code.entity';
import { RefViennaCode } from '@models/ref-vienna-code.entity';
import { RefCopyrightWorkType } from '@models/ref-copyright-work-type.entity';

export class RefRepository {
  private provinceRepo: Repository<RefProvince>;
  private districtRepo: Repository<RefDistrict>;
  private statusRepo: Repository<RefStatus>;
  private niceRepo: Repository<RefNiceClass>;
  private ipcRepo: Repository<RefIpcCode>;
  private locarnoRepo: Repository<RefLocarnoCode>;
  private viennaRepo: Repository<RefViennaCode>;
  private copyrightWorkTypeRepo: Repository<RefCopyrightWorkType>;

  constructor() {
    this.provinceRepo = AppDataSource.getRepository(RefProvince);
    this.districtRepo = AppDataSource.getRepository(RefDistrict);
    this.statusRepo = AppDataSource.getRepository(RefStatus);
    this.niceRepo = AppDataSource.getRepository(RefNiceClass);
    this.ipcRepo = AppDataSource.getRepository(RefIpcCode);
    this.locarnoRepo = AppDataSource.getRepository(RefLocarnoCode);
    this.viennaRepo = AppDataSource.getRepository(RefViennaCode);
    this.copyrightWorkTypeRepo = AppDataSource.getRepository(RefCopyrightWorkType);
  }

  getProvinces(): Promise<RefProvince[]> {
    return this.provinceRepo.find({ order: { name: 'ASC' } });
  }

  getDistricts(provinceCode?: string): Promise<RefDistrict[]> {
    const where = provinceCode ? { province_code: provinceCode } : {};
    return this.districtRepo.find({ where, order: { name: 'ASC' } });
  }

  getStatuses(): Promise<RefStatus[]> {
    return this.statusRepo.find({ order: { sort_order: 'ASC' } });
  }

  getNiceClasses(): Promise<RefNiceClass[]> {
    return this.niceRepo.find({ order: { class_no: 'ASC' } });
  }

  getIpcCodes(q?: string, parent?: string): Promise<RefIpcCode[]> {
    const qb = this.ipcRepo.createQueryBuilder('ipc');
    if (q) {
      qb.andWhere(
        '(ipc.code LIKE :q OR ipc.description_vi LIKE :q OR ipc.description_en LIKE :q)',
        { q: `%${q}%` }
      );
    }
    if (parent) {
      qb.andWhere('ipc.parent_code = :parent', { parent });
    } else if (!q) {
      // Nếu không có q và không có parent, chỉ lấy level 1
      qb.andWhere('ipc.level = 1');
    }
    return qb.orderBy('ipc.code', 'ASC').limit(200).getMany();
  }

  getLocarnoCodes(parent?: string): Promise<RefLocarnoCode[]> {
    const qb = this.locarnoRepo.createQueryBuilder('loc');
    if (parent) {
      qb.where('loc.parent_code = :parent', { parent });
    } else {
      qb.where('loc.level = 1');
    }
    return qb.orderBy('loc.code', 'ASC').getMany();
  }

  getViennaCodes(parent?: string): Promise<RefViennaCode[]> {
    const qb = this.viennaRepo.createQueryBuilder('vie');
    if (parent) {
      qb.where('vie.parent_code = :parent', { parent });
    } else {
      qb.where('vie.level = 1');
    }
    return qb.orderBy('vie.code', 'ASC').limit(200).getMany();
  }

  getCopyrightWorkTypes(): Promise<RefCopyrightWorkType[]> {
    return this.copyrightWorkTypeRepo.find({ order: { code: 'ASC' } });
  }
}
