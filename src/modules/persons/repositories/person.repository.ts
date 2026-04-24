import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@infrastructure/database';
import { Person } from '@models/person.entity';
import { QueryPersonDto } from '../dto/person.dto';

export class PersonRepository {
  private repo: Repository<Person>;

  constructor() {
    this.repo = AppDataSource.getRepository(Person);
  }

  async findById(id: string): Promise<Person | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findMany(query: QueryPersonDto, page: number, limit: number): Promise<[Person[], number]> {
    const qb = this.repo.createQueryBuilder('p').where('p.deleted_at IS NULL');

    if (query.q) {
      qb.andWhere('(p.full_name LIKE :q OR p.full_name_en LIKE :q)', { q: `%${query.q}%` });
    }
    if (query.nationality) {
      qb.andWhere('p.nationality = :nationality', { nationality: query.nationality });
    }
    if (query.province_code) {
      qb.andWhere('p.province_code = :province_code', { province_code: query.province_code });
    }

    qb.orderBy('p.full_name', 'ASC').skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async create(data: Partial<Person>): Promise<Person> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Person>): Promise<Person | null> {
    await this.repo.update(id, data as QueryDeepPartialEntity<Person>);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
