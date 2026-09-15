// @ts-nocheck
import styles from './Select.module.css';

export const Select = ({  options, value, setValue  }: any) => {
  
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
