import React, { forwardRef, useState } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';

interface Column<T = any> {
  key: string;
  title: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
  bordered?: boolean;
  className?: string;
}

const Table = forwardRef<HTMLTableElement, TableProps>(({
  columns,
  data,
  loading = false,
  empty = 'No data available',
  rowKey = 'id',
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  striped = false,
  hover = true,
  compact = false,
  bordered = false,
  className = ''
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, animation, typography, components } = siteDesignSystem;
  const themeColors = colors[theme];

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: typography.fontFamily.primary,
    backgroundColor: themeColors.surface.primary,
    border: bordered ? `1px solid ${themeColors.border.subtle}` : 'none',
    borderRadius: bordered ? `${foundations.radius.lg}px` : '0',
    overflow: 'hidden'
  };

  const theadStyles: React.CSSProperties = {
    backgroundColor: themeColors.surface.secondary,
    borderBottom: `2px solid ${themeColors.border.subtle}`
  };

  const thStyles: React.CSSProperties = {
    padding: compact ? `${foundations.grid.spacing.sm}px` : `${foundations.grid.spacing.md}px`,
    fontSize: `${typography.fontSize.sm}px`,
    fontWeight: typography.fontWeight.semibold,
    color: themeColors.text.secondary,
    textAlign: 'left',
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    position: 'relative',
    userSelect: 'none'
  };

  const sortableThStyles: React.CSSProperties = {
    ...thStyles,
    cursor: 'pointer',
    transition: `color ${animation.duration.fast}ms ${animation.easing.easeOut}`
  };

  const tbodyStyles: React.CSSProperties = {
    backgroundColor: themeColors.surface.primary
  };

  const getTrStyles = (index: number, clickable: boolean): React.CSSProperties => ({
    backgroundColor: striped && index % 2 === 1 ? themeColors.surface.secondary : 'transparent',
    cursor: clickable ? 'pointer' : 'default',
    transition: `background-color ${animation.duration.fast}ms ${animation.easing.easeOut}`
  });

  const tdStyles: React.CSSProperties = {
    padding: compact ? `${foundations.grid.spacing.sm}px` : `${foundations.grid.spacing.md}px`,
    fontSize: `${typography.fontSize.base}px`,
    color: themeColors.text.primary,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    verticalAlign: 'middle'
  };

  const loadingStyles: React.CSSProperties = {
    position: 'relative',
    textAlign: 'center',
    padding: `${foundations.grid.spacing.xl}px`,
    color: themeColors.text.secondary
  };

  const emptyStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: `${foundations.grid.spacing.xl}px`,
    color: themeColors.text.secondary,
    fontStyle: 'italic'
  };

  const sortIconStyles: React.CSSProperties = {
    marginLeft: `${foundations.grid.spacing.xs}px`,
    fontSize: '12px',
    opacity: 0.6
  };

  const handleSort = (column: Column) => {
    if (!column.sortable || !onSort) return;

    const newDirection = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  const handleRowClick = (record: any, index: number) => {
    if (onRowClick) {
      onRowClick(record, index);
    }
  };

  const handleRowHover = (e: React.MouseEvent<HTMLTableRowElement>, isEnter: boolean) => {
    if (!hover) return;
    
    const target = e.currentTarget;
    if (isEnter) {
      target.style.backgroundColor = themeColors.surface.tertiary;
    } else {
      const index = Array.from(target.parentNode?.children || []).indexOf(target);
      target.style.backgroundColor = striped && index % 2 === 1 
        ? themeColors.surface.secondary 
        : 'transparent';
    }
  };

  const handleThHover = (e: React.MouseEvent<HTMLTableCellElement>, column: Column, isEnter: boolean) => {
    if (!column.sortable) return;
    
    const target = e.currentTarget;
    target.style.color = isEnter ? themeColors.text.primary : themeColors.text.secondary;
  };

  const getRowKey = (record: any, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const renderSortIcon = (column: Column) => {
    if (!column.sortable) return null;
    
    let icon = '↕';
    if (sortKey === column.key) {
      icon = sortDirection === 'asc' ? '↑' : '↓';
    }
    
    return <span style={sortIconStyles}>{icon}</span>;
  };

  const renderCell = (column: Column, record: any, index: number) => {
    const value = record[column.key];
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    return value;
  };

  return (
    <div className={`ui-pro-table-container ${className}`}>
      <table
        ref={ref}
        style={tableStyles}
        className={`ui-pro-table ${striped ? 'ui-pro-table--striped' : ''} ${hover ? 'ui-pro-table--hover' : ''} ${compact ? 'ui-pro-table--compact' : ''} ${bordered ? 'ui-pro-table--bordered' : ''}`}
      >
        <thead style={theadStyles} className="ui-pro-table-header">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...(column.sortable ? sortableThStyles : thStyles),
                  width: column.width,
                  minWidth: column.minWidth,
                  textAlign: column.align || 'left'
                }}
                className={`ui-pro-table-th ${column.sortable ? 'ui-pro-table-th--sortable' : ''} ${column.className || ''}`}
                onClick={() => handleSort(column)}
                onMouseEnter={(e) => handleThHover(e, column, true)}
                onMouseLeave={(e) => handleThHover(e, column, false)}
              >
                {column.title}
                {renderSortIcon(column)}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody style={tbodyStyles} className="ui-pro-table-body">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={loadingStyles}
                className="ui-pro-table-loading"
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: `${foundations.grid.spacing.sm}px`
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${themeColors.border.subtle}`,
                    borderTop: `2px solid ${themeColors.surface.accent}`,
                    borderRadius: '50%',
                    animation: 'ui-pro-spin 1s linear infinite'
                  }} />
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={emptyStyles}
                className="ui-pro-table-empty"
              >
                {empty}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                style={getTrStyles(index, !!onRowClick)}
                className="ui-pro-table-row"
                onClick={() => handleRowClick(record, index)}
                onMouseEnter={(e) => handleRowHover(e, true)}
                onMouseLeave={(e) => handleRowHover(e, false)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      ...tdStyles,
                      textAlign: column.align || 'left',
                      width: column.width,
                      minWidth: column.minWidth
                    }}
                    className={`ui-pro-table-td ${column.className || ''}`}
                  >
                    {renderCell(column, record, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      <style jsx global>{`
        @keyframes ui-pro-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

Table.displayName = 'Table';

// Data List component for simpler data display
interface DataListProps {
  data: Array<{ label: string; value: React.ReactNode; key?: string }>;
  layout?: 'vertical' | 'horizontal';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DataList = forwardRef<HTMLDListElement, DataListProps>(({
  data,
  layout = 'vertical',
  spacing = 'md',
  className = ''
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, typography } = siteDesignSystem;
  const themeColors = colors[theme];

  const spacingMap = {
    sm: foundations.grid.spacing.sm,
    md: foundations.grid.spacing.md,
    lg: foundations.grid.spacing.lg
  };

  const listStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    fontFamily: typography.fontFamily.primary
  };

  const itemStyles: React.CSSProperties = {
    display: layout === 'horizontal' ? 'flex' : 'block',
    alignItems: layout === 'horizontal' ? 'baseline' : 'stretch',
    marginBottom: `${spacingMap[spacing]}px`,
    gap: layout === 'horizontal' ? `${foundations.grid.spacing.md}px` : '0'
  };

  const labelStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.sm}px`,
    fontWeight: typography.fontWeight.medium,
    color: themeColors.text.secondary,
    marginBottom: layout === 'vertical' ? `${foundations.grid.spacing.xs}px` : '0',
    minWidth: layout === 'horizontal' ? '120px' : 'auto',
    flexShrink: 0
  };

  const valueStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.base}px`,
    color: themeColors.text.primary,
    margin: 0
  };

  return (
    <dl
      ref={ref}
      style={listStyles}
      className={`ui-pro-data-list ui-pro-data-list--${layout} ui-pro-data-list--${spacing} ${className}`}
    >
      {data.map((item, index) => (
        <div
          key={item.key || index}
          style={itemStyles}
          className="ui-pro-data-list-item"
        >
          <dt style={labelStyles} className="ui-pro-data-list-label">
            {item.label}
          </dt>
          <dd style={valueStyles} className="ui-pro-data-list-value">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
});

DataList.displayName = 'DataList';

// Stats Grid for displaying key metrics
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(({
  title,
  value,
  change,
  icon,
  className = ''
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, typography, components } = siteDesignSystem;
  const themeColors = colors[theme];

  const cardStyles: React.CSSProperties = {
    padding: `${foundations.grid.spacing.lg}px`,
    backgroundColor: themeColors.surface.primary,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: `${foundations.radius.lg}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.sm}px`
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const titleStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.sm}px`,
    color: themeColors.text.secondary,
    margin: 0,
    fontWeight: typography.fontWeight.medium
  };

  const valueStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize['2xl']}px`,
    fontWeight: typography.fontWeight.bold,
    color: themeColors.text.primary,
    margin: 0
  };

  const changeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${foundations.grid.spacing.xs}px`,
    fontSize: `${typography.fontSize.sm}px`,
    fontWeight: typography.fontWeight.medium
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return themeColors.text.success;
      case 'down': return themeColors.text.error;
      default: return themeColors.text.secondary;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div
      ref={ref}
      style={cardStyles}
      className={`ui-pro-stat-card ${className}`}
    >
      <div style={headerStyles}>
        <h3 style={titleStyles}>{title}</h3>
        {icon && <span className="ui-pro-stat-icon">{icon}</span>}
      </div>
      
      <div style={valueStyles} className="ui-pro-stat-value">
        {value}
      </div>
      
      {change && (
        <div
          style={{
            ...changeStyles,
            color: getTrendColor(change.trend)
          }}
          className="ui-pro-stat-change"
        >
          <span>{getTrendIcon(change.trend)}</span>
          <span>{change.value}</span>
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default Table;