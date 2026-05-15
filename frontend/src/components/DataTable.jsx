import { useMemo, useState } from 'react';
import Modal from './Modal';
import './DataTable.css';

function getValueContent(field, row) {
  const rawValue = row[field.key];

  if (field.render) {
    return field.render(rawValue, row);
  }

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '—';
  }

  return rawValue;
}

export default function DataTable({
  columns,
  rows,
  emptyText = 'Нет данных',
  detailsFields = [],
  detailsTitle,
  rowLabel = 'Открыть подробную информацию',
  renderModalContent,
  onRowClick,
}) {
  const [selectedRow, setSelectedRow] = useState(null);
  const isInteractive = detailsFields.length > 0;

  const modalTitle = useMemo(() => {
    if (!selectedRow) {
      return '';
    }

    if (typeof detailsTitle === 'function') {
      return detailsTitle(selectedRow);
    }

    return detailsTitle ?? 'Подробная информация';
  }, [detailsTitle, selectedRow]);

  return (
    <>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  aria-label={isInteractive ? rowLabel : undefined}
                  className={isInteractive ? 'table-row--interactive' : ''}
                  key={row.id}
                  onClick={isInteractive ? () => {
                    onRowClick?.(row);
                    setSelectedRow(row);
                  } : undefined}
                  onKeyDown={isInteractive
                    ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick?.(row);
                        setSelectedRow(row);
                      }
                    }
                    : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <Modal onClose={() => setSelectedRow(null)} title={modalTitle}>
          {renderModalContent ? renderModalContent(selectedRow, () => setSelectedRow(null)) : (
            <dl className="details-grid">
              {detailsFields.map((field) => (
                <div className="details-item" key={field.key}>
                  <dt>{field.label}</dt>
                  <dd>{getValueContent(field, selectedRow)}</dd>
                </div>
              ))}
            </dl>
          )}
        </Modal>
      ) : null}
    </>
  );
}
