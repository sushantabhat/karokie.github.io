import { classNames } from '@/lib/autotone/utils/reactUtils.js';
import styles from './Card.module.css';

export const Card = ({ className, children }) => {
  return (
    <div className={classNames(
      className,
      styles.card,
    )}>
      {children}
    </div>
  );
};