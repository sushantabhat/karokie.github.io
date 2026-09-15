// @ts-nocheck
import { classNames } from '@/lib/autotone/utils/reactUtils';
import styles from './Button.module.css';

export const Button = ({ 
  className,
  onClick,
  disabled,
  Icon,
  large,
  small,
  secondary,
  ariaLabel,
 }: any) => {
  return (
    <button aria-label={ariaLabel} 
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        className,
        styles.button,
        (disabled && styles.disabled),
        (large && styles.large),
        (small && styles.small),
        (secondary && styles.secondary),
      )
    }>
      <div className={styles.icon}>
        <Icon
          size={
            (large && 24) ||
            (small && 16)  
          }
        />
      </div>
    </button>
  );
};
