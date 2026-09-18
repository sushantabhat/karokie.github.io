// @ts-nocheck
import styles from './Select.module.css';

interface SelectProps {
  options: (string | number)[];
  value: string | number;
  setValue: (value: string) => void;
  ariaLabel?: string;
}

export const Select = ({ options, value, setValue, ariaLabel }: SelectProps) => {
  
  const onChange = (event) => setValue(event.target.value);
  
  return (
    <select aria-label={ariaLabel} 
      className={styles.select}
      value={value} 
      onChange={onChange}
    >
      {options.map((value, index) => (
        <option 
          value={value} 
          key={index}
        >
          {value}
        </option>
      ))}
    </select>
  );
};
