import { classNames } from '@/lib/autotone/utils/reactUtils';
import styles from './Card.module.css';

export const Card = ({  className, children  }: any) => {
  return (
    <div className={classNames(
      className,
      styles.card,
    )}>
      {children}
    </div>
  );
};