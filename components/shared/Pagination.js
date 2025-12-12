import { useState } from "react";

export default function Pagination({ totalPages, currentPage, onPageChange, totalItems, setPageSize, pageSize }) {
  const [startPage, setStartPage] = useState(1);

  const handleNext = () => {
    if (currentPage >= startPage + 2 && currentPage < totalPages) {
      setStartPage(startPage + 1);
    }
    onPageChange(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage <= startPage && currentPage > 1) {
      setStartPage(startPage - 1);
    }
    onPageChange(currentPage - 1);
  };

  const handlePageChange = (page) => {
    if (page >= startPage && page <= startPage + 2) {
      onPageChange(page);
    } else if (page < startPage) {
      setStartPage(page);
      onPageChange(page);
    } else if (page > startPage + 2) {
      setStartPage(page - 2);
      onPageChange(page);
    }
  };

  const handleForward = () => {
    if (currentPage + 5 <= totalPages) {
      setStartPage(currentPage + 1);
      onPageChange(currentPage + 5);
    }
  };

  const handleBackward = () => {
    if (currentPage - 5 >= 1) {
      setStartPage(Math.max(1, currentPage - 5));
      onPageChange(Math.max(1, currentPage - 5));
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const endPage = Math.min(startPage + 4, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} className="pagination__item">
          <button
            className={`pagination__button ${
              i === currentPage ? "pagination__button--active" : ""
            }`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }
    return pageNumbers;
  };

  const handlePageSizeChange = (e) =>{
  const value = e.target.value;
  setPageSize(value); 
  localStorage.setItem("pageSize", value)
  }

  return (
    <>
          <div className="pagination">
    <div>
      <span>Showing </span>
      <select name="items" id="" value={pageSize} onChange={handlePageSizeChange}>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="30">30</option>
        <option value="40">40</option>
      </select>
      <span>of {totalItems} results</span>
    </div>
        <nav className="pagination__nav" aria-label="pagination navigation">
          <ul className="pagination__list">
            <li className="pagination__item pagination__item--prev">
              <button
                className="pagination__button pagination__button--nav"
                onClick={handlePrev}
                disabled={currentPage === 1}
              >
                Prev
              </button>
            </li>

            {startPage > 1 && (
              <>
                <li className="pagination__item">
                  <button
                    className="pagination__button"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                </li>
                <li className="pagination__item pagination__item--ellipsis">
                  <button
                    className="pagination__button"
                    onClick={handleBackward}
                  >
                    ...
                  </button>
                </li>
              </>
            )}

            {renderPageNumbers()}

            {startPage + 4 < totalPages && (
              <>
                <li className="pagination__item pagination__item--ellipsis">
                  <button
                    className="pagination__button"
                    onClick={handleForward}
                  >
                    ...
                  </button>
                </li>
                <li className="pagination__item">
                  <button
                    className="pagination__button"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                </li>
              </>
            )}

            <li className="pagination__item pagination__item--next">
              <button
                className="pagination__button pagination__button--nav"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
