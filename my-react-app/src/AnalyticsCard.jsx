import React from 'react';
import { isArabic } from './utils';

/**
 * Reusable Analytics Card Component
 * Supports bilingual content with automatic RTL for Arabic text
 */
const AnalyticsCard = ({ title, children, variant = 'default' }) => {
  const variants = {
    default: {
      background: '#ffffff',
      borderColor: '#e5e7eb',
    },
    success: {
      background: '#f0fdf4',
      borderColor: '#86efac',
    },
    warning: {
      background: '#fefce8',
      borderColor: '#fde047',
    },
    danger: {
      background: '#fef2f2',
      borderColor: '#fca5a5',
    },
    info: {
      background: '#eff6ff',
      borderColor: '#93c5fd',
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      style={{
        background: style.background,
        border: `1px solid ${style.borderColor}`,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          textAlign: 'left',
        }}
      >
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
};

/**
 * Statistic display component
 */
export const Stat = ({ label, value, color = '#111827' }) => {
  const valueIsArabic = isArabic(String(value));

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '4px',
          textAlign: 'left',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: '700',
          color: color,
          direction: valueIsArabic ? 'rtl' : 'ltr',
          textAlign: valueIsArabic ? 'right' : 'left',
        }}
      >
        {value || 'N/A'}
      </div>
    </div>
  );
};

/**
 * Text content with automatic RTL support
 */
export const BilingualText = ({ text, style = {} }) => {
  const textIsArabic = isArabic(String(text));

  return (
    <div
      style={{
        direction: textIsArabic ? 'rtl' : 'ltr',
        textAlign: textIsArabic ? 'right' : 'left',
        ...style,
      }}
    >
      {text || 'N/A'}
    </div>
  );
};

/**
 * List display with bilingual support
 */
export const BilingualList = ({ items, maxItems = 5 }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
        No data available
      </div>
    );
  }

  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <ul
      style={{
        margin: '0',
        padding: '0 0 0 20px',
        listStyleType: 'disc',
      }}
    >
      {displayItems.map((item, index) => {
        const itemIsArabic = isArabic(String(item));
        return (
          <li
            key={index}
            style={{
              marginBottom: '8px',
              color: '#374151',
              fontSize: '14px',
              direction: itemIsArabic ? 'rtl' : 'ltr',
              textAlign: itemIsArabic ? 'right' : 'left',
            }}
          >
            {item}
          </li>
        );
      })}
      {hasMore && (
        <li style={{ color: '#9ca3af', fontStyle: 'italic' }}>
          +{items.length - maxItems} more
        </li>
      )}
    </ul>
  );
};

/**
 * Badge component for tags
 */
export const Badge = ({ text, color = '#3b82f6' }) => {
  const textIsArabic = isArabic(String(text));

  return (
    <span
      style={{
        display: 'inline-block',
        background: `${color}20`,
        color: color,
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '500',
        margin: '4px',
        direction: textIsArabic ? 'rtl' : 'ltr',
      }}
    >
      {text}
    </span>
  );
};

/**
 * Progress bar component
 */
export const ProgressBar = ({ value, max = 10, color = '#3b82f6' }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div
      style={{
        width: '100%',
        height: '8px',
        background: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

/**
 * Grid layout for statistics
 */
export const StatGrid = ({ children, columns = 2 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px',
      }}
    >
      {children}
    </div>
  );
};

export default AnalyticsCard;
