import styles from './Select.module.css';

export const Select = ({ options, value, setValue }) => {
  
  const onChange = (event) => setValue(event.target.value);
  
  return (
    <select aria-label={props.ariaLabel} 
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
