/**
 * @file frontend/src/components/ui/pagination/index.tsx
 */

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui";

import styles from "./styles.module.css";

export interface PaginationProps {
  page: number;
  totalPages?: number; // undefined before the very first page finishes loading
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean; // disables both buttons while a page change is in flight
}

// A small, fully reusable pagination control — built once here, and
// reused again unchanged in Part 9's Admin Products/Orders/Users tables.
export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onNext,
  onPrev,
  isLoading = false,
}: PaginationProps) {
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      <Button
        variant="secondary"
        size="sm"
        onClick={onPrev}
        disabled={!hasPrevPage || isLoading}
      >
        <Icon name="chevronLeft" label="Previous page" />
      </Button>

      <span className={styles.pageInfo}>
        Page {page}
        {totalPages !== undefined && ` of ${totalPages}`}
      </span>

      <Button
        variant="secondary"
        size="sm"
        onClick={onNext}
        disabled={!hasNextPage || isLoading}
      >
        <Icon name="chevronRight" label="Next page" />
      </Button>
    </nav>
  );
}
