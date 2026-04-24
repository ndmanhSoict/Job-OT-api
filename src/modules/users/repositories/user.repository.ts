import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@infrastructure/database';
import { User } from '@models/user.entity';
import { QueryUserDto } from '../dto/query-user.dto';

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findMany(query: QueryUserDto, page: number, limit: number): Promise<[User[], number]> {
    const qb = this.repo.createQueryBuilder('user');

    if (query.q) {
      qb.andWhere(
        '(user.username LIKE :q OR user.email LIKE :q OR user.full_name LIKE :q)',
        { q: `%${query.q}%` }
      );
    }

    if (query.role !== undefined) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.is_active !== undefined) {
      qb.andWhere('user.is_active = :isActive', { isActive: query.is_active });
    }

    qb.orderBy('user.created_at', 'DESC').skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async create(data: Partial<User>): Promise<User> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data as QueryDeepPartialEntity<User>);
    return this.findById(id);
  }
}
