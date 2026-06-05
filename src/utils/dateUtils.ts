export const formatFriendlyDate = (dateInput: string | Date): string => {
  if (!dateInput) return '';
  
  let d: Date;
  
  if (typeof dateInput === 'string') {
    // Check if it's just a YYYY-MM-DD string without timezone
    if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateInput.split('-');
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  // Validate date
  if (isNaN(d.getTime())) return String(dateInput);

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const dayName = days[d.getDay()];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${dayName} ${day} de ${month} de ${year}`;
};
