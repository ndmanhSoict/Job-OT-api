import { RefRepository } from '../repositories/ref.repository';

export class RefService {
  private repo = new RefRepository();

  getProvinces() {
    return this.repo.getProvinces();
  }

  getDistricts(provinceCode?: string) {
    return this.repo.getDistricts(provinceCode);
  }

  getStatuses() {
    return this.repo.getStatuses();
  }

  getNiceClasses() {
    return this.repo.getNiceClasses();
  }

  getIpcCodes(q?: string, parent?: string) {
    return this.repo.getIpcCodes(q, parent);
  }

  getLocarnoCodes(parent?: string) {
    return this.repo.getLocarnoCodes(parent);
  }

  getViennaCodes(parent?: string) {
    return this.repo.getViennaCodes(parent);
  }

  getCopyrightWorkTypes() {
    return this.repo.getCopyrightWorkTypes();
  }
}
