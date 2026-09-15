import { classNames } from '@/lib/autotone/utils/reactUtils';
import styles from './Text.module.css';

export const Text = ({  className, children, center  }: any) => {
  return (
    <div 
      className={classNames(
        className, 
        styles.text, 
        (center && styles.center)
      )}
    >
      {children}
    </div>
  );
};