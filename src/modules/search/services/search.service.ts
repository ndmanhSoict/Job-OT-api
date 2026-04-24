import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { buildPaginationMeta } from '@shared/helpers/pagination.helper';
import { QuerySearchDto } from '../dto/query-search.dto';
import { QuerySearchSuggestDto } from '../dto/query-search-suggest.dto';
import { SearchRepository } from '../repositories/search.repository';

interface SearchHighlight {
  title?: string[];
}

interface SearchItemResponse {
  id: string;
  asset_type: string;
  title: string;
  applicant_name?: string;
  status: string;
  highlight: SearchHighlight;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlight(text: string, keyword: string): string {
  const escapedText = escapeHtml(text);
  const safeKeyword = keyword.trim();

  if (!safeKeyword) {
    return escapedText;
  }

  const regex = new RegExp(escapeRegExp(safeKeyword), 'gi');
  return escapedText.replace(regex, (match) => `<em>${match}</em>`);
}

export class SearchService {
  private repo = new SearchRepository();

  async search(query: QuerySearchDto, page: number, limit: number) {
    const keyword = query.q?.trim();
    if (!keyword) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Từ khóa tìm kiếm q là bắt buộc');
    }

    const [items, total, facets] = await Promise.all([
      this.repo.search(query, page, limit),
      this.repo.countFacets(query),
    ]).then(([[assets, assetTotal], facetCounts]) => [assets, assetTotal, facetCounts] as const);

    const data: SearchItemResponse[] = items.map((item) => ({
      id: item.id,
      asset_type: item.asset_type,
      title: buildHighlight(item.title, keyword),
      applicant_name: item.applicant_name,
      status: item.status,
      highlight: {
        title: [buildHighlight(item.title, keyword)],
      },
    }));

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
      facets,
    };
  }

  async suggest(query: QuerySearchSuggestDto) {
    const keyword = query.q?.trim();
    if (!keyword || keyword.length < 3) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        400,
        'Từ khóa gợi ý q phải có ít nhất 3 ký tự'
      );
    }

    const items = await this.repo.suggest(query);

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      asset_type: item.asset_type,
    }));
  }
}
