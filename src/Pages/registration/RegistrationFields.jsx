function FormField({ id, label, value, onChange, error, type = "text", required = false, placeholder, min, step, inputMode, children, className = "" }) {
  const errorId = `${id}-error`;
  return (
    <div className={`relative min-w-0 mb-0 flex flex-col pt-1.5 ${className}`}>
      <label htmlFor={id} className="absolute top-0 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 z-10 leading-none pointer-events-none">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children || (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          placeholder={placeholder}
          min={min}
          step={step}
          inputMode={inputMode}
          className="w-full h-[42px] px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 text-[13px] outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
        />
      )}
      {error && <p className="text-red-600 text-[11px] mt-1" id={errorId}>{error}</p>}
    </div>
  );
}

function SelectField({ id, label, value, onChange, error, options, required = false }) {
  const errorId = `${id}-error`;
  return (
    <FormField id={id} label={label} value={value} onChange={onChange} error={error} required={required}>
      <select 
        id={id} 
        name={id} 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
        required={required} 
        aria-invalid={Boolean(error)} 
        aria-describedby={error ? errorId : undefined}
        className="w-full h-[42px] px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 text-[13px] outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
      >
        <option value="">Select an option</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </FormField>
  );
}

function RadioField({ id, label, value, onChange, options, error, required = false }) {
  const errorId = `${id}-error`;
  return (
    <div className="relative min-w-0 mb-0 flex flex-col justify-center min-h-[42px] px-3 py-2 border border-slate-300 rounded-md bg-white">
      <span className="text-slate-700 text-[12px] font-bold block mb-1" id={`${id}-label`}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className="flex items-center gap-4 mt-0.5" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={error ? errorId : undefined}>
        {options.map((option) => (
          <label className="inline-flex items-center gap-1.5 text-[13px] text-slate-900 cursor-pointer" key={option}>
            <input 
              type="radio" 
              name={id} 
              value={option} 
              checked={value === option} 
              onChange={(event) => onChange(event.target.value)} 
              required={required && !value} 
              aria-invalid={Boolean(error)} 
              className="w-4 h-4 accent-teal-600 m-0 p-0"
            />
            {option}
          </label>
        ))}
      </div>
      {error && <p className="text-red-600 text-[11px] mt-1" id={errorId}>{error}</p>}
    </div>
  );
}

function FormSection({ id, number, title, children, className = "", active = true }) {
  return (
    <section
      id={id}
      className={`mb-5 bg-white border border-slate-200 rounded-lg shadow-sm scroll-mt-6 ${className}`}
      hidden={!active}
      role="tabpanel"
    >
      <div className="flex items-center gap-3 min-h-[62px] px-5 py-3.5 border-b border-slate-200 cursor-pointer">
        <span className="text-teal-700 text-[12px] font-extrabold tracking-wide">{number}</span>
        <h2 className="text-[#102a43] text-[19px] font-bold m-0">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export { FormField, SelectField, RadioField, FormSection };