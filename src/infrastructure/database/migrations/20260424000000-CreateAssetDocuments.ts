import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAssetDocuments20260424000000 implements MigrationInterface {
  name = 'CreateAssetDocuments20260424000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'asset_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'asset_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'doc_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'doc_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'original_filename',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'uploaded_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'asset_documents',
      new TableIndex({
        name: 'IDX_asset_documents_asset_id',
        columnNames: ['asset_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('asset_documents', 'IDX_asset_documents_asset_id');
    await queryRunner.dropTable('asset_documents');
  }
}
