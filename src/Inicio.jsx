import Materia from './Materia.jsx';
import materiasArray from './MateriasArray.jsx';
import { useState } from 'react';

function Inicio() {
    const [estadoMateria, setEstadoMateria] = useState(() => {
        const estadoInicial = calcularMateriasDesbloqueadas(materiasArray);
        // Forzar bloqueo inicial de todas las materias con correlativas
        return estadoInicial.map(anio => ({
            ...anio,
            materias: anio.materias.map(materia => ({
                ...materia,
                desbloqueada: materia.correlativas.length === 0
            }))
        }));
    });

    const cambiarMateria = (iAno, iMateria) => {
        setEstadoMateria(prev => {
            const nuevasMaterias = prev.map(anio => ({
                ...anio,
                materias: anio.materias.map(materia => ({ ...materia }))
            }));

            const materiaActualizada = {
                ...nuevasMaterias[iAno].materias[iMateria],
                aprobada: !nuevasMaterias[iAno].materias[iMateria].aprobada
            };

            nuevasMaterias[iAno].materias[iMateria] = materiaActualizada;

            // Recalcular desbloqueo para todas las materias
            return calcularMateriasDesbloqueadas(nuevasMaterias);
        });
    }

    function calcularMateriasDesbloqueadas(todasLasMaterias) {
        const materiasPlanas = todasLasMaterias.flatMap(año => año.materias);

        return todasLasMaterias.map(año => ({
            ...año,
            materias: año.materias.map(materia => ({
                ...materia,
                desbloqueada: materia.correlativas.length === 0 || // Sin correlativas
                    materia.correlativas.every(idCorrelativa => {
                        const correlativa = materiasPlanas.find(m => m.id === idCorrelativa);
                        return correlativa?.aprobada;
                    }) ||
                    materia.aprobada // Ya aprobada
            }))
        }));
    }

    return (
        <div>
            <div className="titulo">
                <img src="img/UTN-LOGO.png" alt="Logo UTN" />
                <h1>Ingeniería en Sistemas de Información</h1>
            </div>
            <h2>Plan de estudios <span>(UTN)</span></h2>
            <div className="plan">
                {estadoMateria.map((anio, iAno) => (
                    <div className='ano' key={anio.ano}>
                        <h3>{anio.ano}</h3>
                        <div className='materias'>
                            {anio.materias.map((materia, iMateria) => (
                                <Materia
                                    key={materia.id}
                                    materia={materia}
                                    iAno={iAno}
                                    iMateria={iMateria}
                                    onClick={cambiarMateria}
                                />
                            ))}
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}

export default Inicio;
