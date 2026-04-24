import { Person } from '@models/person.entity';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { buildPaginationMeta } from '@shared/helpers/pagination.helper';
import { PersonRepository } from '../repositories/person.repository';
import { CreatePersonDto, UpdatePersonDto, QueryPersonDto } from '../dto/person.dto';

/** Fields hidden from Guest/public responses */
const SENSITIVE_FIELDS: Array<keyof Person> = ['id_number', 'phone', 'email'];

function toPublic(person: Person): Omit<Person, 'id_number' | 'phone' | 'email'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id_number: _i, phone: _p, email: _e, ...pub } = person;
  return pub;
}

export class PersonService {
  private repo = new PersonRepository();

  async list(query: QueryPersonDto, page: number, limit: number, isStaff = false) {
    const [items, total] = await this.repo.findMany(query, page, limit);
    const mapped = isStaff ? items : items.map(toPublic);
    return { items: mapped, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string, isStaff = false) {
    const person = await this.repo.findById(id);
    if (!person) throw new AppError(ErrorCode.PERSON_NOT_FOUND, 404, 'Không tìm thấy cá nhân');
    return isStaff ? person : toPublic(person);
  }

  async create(dto: CreatePersonDto) {
    return this.repo.create({
      full_name: dto.full_name,
      full_name_en: dto.full_name_en,
      id_number: dto.id_number,
      nationality: dto.nationality ?? 'Việt Nam',
      address: dto.address,
      district_code: dto.district_code,
      province_code: dto.province_code ?? 'BN',
      phone: dto.phone,
      email: dto.email,
    });
  }

  async update(id: string, dto: UpdatePersonDto) {
    const person = await this.repo.findById(id);
    if (!person) throw new AppError(ErrorCode.PERSON_NOT_FOUND, 404, 'Không tìm thấy cá nhân');

    const updated = await this.repo.update(id, {
      ...(dto.full_name !== undefined && { full_name: dto.full_name }),
      ...(dto.full_name_en !== undefined && { full_name_en: dto.full_name_en }),
      ...(dto.id_number !== undefined && { id_number: dto.id_number }),
      ...(dto.nationality !== undefined && { nationality: dto.nationality }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.district_code !== undefined && { district_code: dto.district_code }),
      ...(dto.province_code !== undefined && { province_code: dto.province_code }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.email !== undefined && { email: dto.email }),
    });

    return updated!;
  }

  async remove(id: string): Promise<void> {
    const person = await this.repo.findById(id);
    if (!person) throw new AppError(ErrorCode.PERSON_NOT_FOUND, 404, 'Không tìm thấy cá nhân');
    await this.repo.softDelete(id);
  }
}
