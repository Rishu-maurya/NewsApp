import '../../style/InputField.css';

export default function InputField({ id, label, error, rightSlot, ...inputProps }) {
  const errorId = `${id}-error`;

  return (
    <div className={`field${error ? ' field--error' : ''}${rightSlot ? ' field--with-slot' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field__control">
        <input
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {rightSlot && <div className="field__slot">{rightSlot}</div>}
      </div>
      {error && <p className="field__error" id={errorId}>{error}</p>}
    </div>
  );
}
