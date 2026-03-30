import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ─── Hoist mock variables ─────────────────────────────────────────────────────
const { mockSelect, mockWhere, mockFrom, mockInnerJoin, mockLeftJoin, mockOrderBy, mockLimit, mockOffset, chainable } =
  vi.hoisted(() => {
    const mockSelect = vi.fn();
    const mockWhere = vi.fn();
    const mockFrom = vi.fn();
    const mockInnerJoin = vi.fn();
    const mockLeftJoin = vi.fn();
    const mockOrderBy = vi.fn();
    const mockLimit = vi.fn();
    const mockOffset = vi.fn();

    const chainable: Record<string, ReturnType<typeof vi.fn>> = {
      select: mockSelect,
      where: mockWhere,
      from: mockFrom,
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
      orderBy: mockOrderBy,
      limit: mockLimit,
      offset: mockOffset,
    };
    Object.values(chainable).forEach((fn) => fn.mockReturnValue(chainable));
    mockSelect.mockReturnValue(chainable);

    return {
      mockSelect,
      mockWhere,
      mockFrom,
      mockInnerJoin,
      mockLeftJoin,
      mockOrderBy,
      mockLimit,
      mockOffset,
      chainable,
    };
  });

vi.mock("../../db", () => ({
  db: {
    select: mockSelect,
  },
}));

// ─── Import after mocking ─────────────────────────────────────────────────────
import { searchArticles } from "../../queries/search";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetChain() {
  vi.clearAllMocks();
  mockSelect.mockReturnValue(chainable);
  Object.values(chainable).forEach((fn) =>
    (fn as ReturnType<typeof vi.fn>).mockReturnValue(chainable)
  );
}

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe("searchArticles — unit tests", () => {
  beforeEach(resetChain);

  // Feature: international-newspaper-cms, Property 10: Search returns only published articles matching the query
  it("empty query returns { articles: [], total: 0 }", async () => {
    const result = await searchArticles("");
    expect(result).toEqual({ articles: [], total: 0 });
    // db must NOT be called for empty queries
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("whitespace-only query returns { articles: [], total: 0 }", async () => {
    const result = await searchArticles("   ");
    expect(result).toEqual({ articles: [], total: 0 });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("tab/newline whitespace query returns { articles: [], total: 0 }", async () => {
    const result = await searchArticles("\t\n  ");
    expect(result).toEqual({ articles: [], total: 0 });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("valid query calls db.select", async () => {
    // rows query ends with .offset(), count query ends with .where()
    // We need where to return chainable for the rows chain, and resolve for the count chain.
    // Use mockReturnValueOnce to return chainable for the first where call (rows),
    // then resolve for the second where call (count).
    mockWhere
      .mockReturnValueOnce(chainable)   // rows query: where → chainable (continues to orderBy/limit/offset)
      .mockResolvedValueOnce([{ total: 0 }]); // count query: where → resolves
    mockOffset.mockResolvedValueOnce([]);

    await searchArticles("climate");

    expect(mockSelect).toHaveBeenCalled();
  });

  it("valid query returns articles and total from db", async () => {
    const fakeArticle = {
      id: 1,
      title: "Climate Change Today",
      slug: "climate-change-today",
      excerpt: "An article about climate",
      publishedAt: new Date("2024-06-01"),
      authorName: "Jane Doe",
      isBreakingNews: false,
      isFeatured: false,
      coverImageId: null,
      coverImageUrl: null,
      categoryId: 1,
      categoryName: "World",
      categorySlug: "world",
    };

    mockWhere
      .mockReturnValueOnce(chainable)
      .mockResolvedValueOnce([{ total: 1 }]);
    mockOffset.mockResolvedValueOnce([fakeArticle]);

    const result = await searchArticles("climate");

    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.articles[0].title).toBe("Climate Change Today");
  });

  it("valid query with no results returns { articles: [], total: 0 }", async () => {
    mockWhere
      .mockReturnValueOnce(chainable)
      .mockResolvedValueOnce([{ total: 0 }]);
    mockOffset.mockResolvedValueOnce([]);

    const result = await searchArticles("xyznotfound");

    expect(result).toEqual({ articles: [], total: 0 });
  });
});

// ─── Property-based tests (Property 10) ──────────────────────────────────────

describe("searchArticles — property-based tests (Property 10)", () => {
  beforeEach(resetChain);

  // Feature: international-newspaper-cms, Property 10: Search returns only published articles matching the query
  it("property: any empty string query returns empty results without calling db (Property 10)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(""), async (query) => {
        resetChain();
        const result = await searchArticles(query);
        expect(result).toEqual({ articles: [], total: 0 });
        expect(mockSelect).not.toHaveBeenCalled();
      }),
      { numRuns: 10 }
    );
  });

  // Feature: international-newspaper-cms, Property 10: Search returns only published articles matching the query
  it("property: any whitespace-only string returns empty results without calling db (Property 10)", async () => {
    // Generate strings that are non-empty but contain only whitespace characters
    const whitespaceArb = fc
      .array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 10 })
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(whitespaceArb, async (query) => {
        resetChain();
        const result = await searchArticles(query);
        expect(result).toEqual({ articles: [], total: 0 });
        expect(mockSelect).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: international-newspaper-cms, Property 10: Search returns only published articles matching the query
  it("property: any non-empty (non-whitespace) query calls the database (Property 10)", async () => {
    // Generate strings with at least one non-whitespace character
    const nonEmptyQueryArb = fc
      .string({ minLength: 1 })
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(nonEmptyQueryArb, async (query) => {
        resetChain();
        // rows query: where returns chainable so chain continues to orderBy/limit/offset
        // count query: where resolves with count result
        mockWhere
          .mockReturnValueOnce(chainable)
          .mockResolvedValueOnce([{ total: 0 }]);
        mockOffset.mockResolvedValueOnce([]);

        await searchArticles(query);

        // db.select must have been called for a real query
        expect(mockSelect).toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: international-newspaper-cms, Property 10: Search returns only published articles matching the query
  it("property: result always has articles array and numeric total (Property 10)", async () => {
    const nonEmptyQueryArb = fc
      .string({ minLength: 1 })
      .filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(nonEmptyQueryArb, async (query) => {
        resetChain();
        mockWhere
          .mockReturnValueOnce(chainable)
          .mockResolvedValueOnce([{ total: 0 }]);
        mockOffset.mockResolvedValueOnce([]);

        const result = await searchArticles(query);

        expect(Array.isArray(result.articles)).toBe(true);
        expect(typeof result.total).toBe("number");
        expect(result.total).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});
