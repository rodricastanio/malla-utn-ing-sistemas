function Materia({ materia, iAno, iMateria, onClick }) {
  // Determinar si es de primer año (sin correlativas)
  const esPrimerAño = materia.correlativas.length === 0;

  // Estilos base
  const baseStyles = {
    backgroundColor: materia.aprobada ? '#A5D6A7' : 
                    materia.desbloqueada ? '#FFF9C4' : '#F8BBD0',
    color: '#000',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: materia.desbloqueada ? 'pointer' : 'not-allowed',
    opacity: materia.desbloqueada ? 1 : 0.8,
    position: 'relative',
    transition: 'all 0.3s ease',
    margin: '5px',
    minWidth: '120px',
    textAlign: 'left',
    boxShadow: materia.desbloqueada ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
    filter: esPrimerAño ? 'none' : !materia.desbloqueada ? 'blur(1.5px)' : 'none'
  };

  // Resto del componente permanece igual...
  const lockIconStyle = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px'
  };

  return (
    <div className='materia' style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        style={baseStyles}
        onClick={() => materia.desbloqueada && onClick(iAno, iMateria)}
        disabled={!materia.desbloqueada}
      >
        {materia.titulo}
        {!materia.desbloqueada && !esPrimerAño && (
          <span style={lockIconStyle}>🔒</span>
        )}
      </button>
    </div>
  );
}

export default Materia;