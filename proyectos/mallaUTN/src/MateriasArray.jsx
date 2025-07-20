const materiasArray = [
  {
    ano: '1° año',
    materias: [
      { id: 1, titulo: 'Análisis Matemático I', correlativas: [], aprobada: false, desbloqueada: false },
      { id: 2, titulo: 'Álgebra y Geometría Analítica', correlativas: [],  aprobada: false, desbloqueada: false},
      { id: 3, titulo: 'Física I', correlativas: [],  aprobada: false, desbloqueada: false },
      { id: 4, titulo: 'Inglés I', correlativas: [],  aprobada: false, desbloqueada: false  },
      { id: 5, titulo: 'Lógica y Estructuras Discretas', correlativas: [],  aprobada: false , desbloqueada: false},
      { id: 6, titulo: 'Algoritmos y Estructuras de Datos', correlativas: [],  aprobada: false, desbloqueada: false  },
      { id: 7, titulo: 'Arquitecturas de Computadoras', correlativas: [],  aprobada: false, desbloqueada: false  },
      { id: 8, titulo: 'Sistemas y Procesos de Negocio', correlativas: [],  aprobada: false, desbloqueada: false  },
    ],
  },
  {
    ano: '2° año',
    materias: [
      { id: 9, titulo: 'Análisis Matemático II', correlativas: [1, 2],  aprobada: false, desbloqueada: false  },
      { id: 10, titulo: 'Física II', correlativas: [1, 3],  aprobada: false, desbloqueada: false  },
      { id: 11, titulo: 'Ingeniería y Sociedad', correlativas: [],  aprobada: false, desbloqueada: false  },
      { id: 12, titulo: 'Inglés II', correlativas: [4],  aprobada: false, desbloqueada: false  },
      { id: 13, titulo: 'Sintaxis y Semántica del Lenguaje', correlativas: [5, 6],  aprobada: false, desbloqueada: false  },
      { id: 14, titulo: 'Paradigmas de Programación', correlativas: [5, 6],  aprobada: false, desbloqueada: false  },
      { id: 15, titulo: 'Sistemas Operativos', correlativas: [7],  aprobada: false, desbloqueada: false  },
      { id: 16, titulo: 'Análisis de Sistemas de Información (Integradora)', correlativas: [6, 8],  aprobada: false, desbloqueada: false  },
    ],
  },
  {
    ano: '3° año',
    materias: [
      { id: 17, titulo: 'Probabilidades y Estadística', correlativas: [1, 2],  aprobada: false, desbloqueada: false  },
      { id: 18, titulo: 'Economía', correlativas: [1, 2],  aprobada: false, desbloqueada: false  },
      { id: 19, titulo: 'Bases de Datos', correlativas: [13, 16],  aprobada: false, desbloqueada: false  },
      { id: 20, titulo: 'Desarrollo de Software', correlativas: [14, 16],  aprobada: false, desbloqueada: false  },
      { id: 21, titulo: 'Comunicación de Datos', correlativas: [3, 7],  aprobada: false, desbloqueada: false  },
      { id: 22, titulo: 'Análisis Numérico', correlativas: [9],  aprobada: false, desbloqueada: false  },
      { id: 23, titulo: 'Diseño de Sistemas de Información (Integradora)', correlativas: [14, 16],  aprobada: false, desbloqueada: false },
    ],
  },
  {
    ano: '4° año',
    materias: [
      { id: 24, titulo: 'Legislación', correlativas: [11],  aprobada: false, desbloqueada: false  },
      { id: 25, titulo: 'Ingeniería y Calidad de Software', correlativas: [19, 20, 23], aprobada: false, desbloqueada: false  },
      { id: 26, titulo: 'Redes de Datos', correlativas: [15, 21],  aprobada: false, desbloqueada: false  },
      { id: 27, titulo: 'Investigación Operativa', correlativas: [17, 22],  aprobada: false, desbloqueada: false  },
      { id: 28, titulo: 'Simulación', correlativas: [17],  aprobada: false, desbloqueada: false  },
      { id: 29, titulo: 'Tecnologías para la Automatización', correlativas: [10, 22],  aprobada: false, desbloqueada: false },
      { id: 30, titulo: 'Administración de Sistemas de Información (Integradora)', correlativas: [18, 23],  aprobada: false, desbloqueada: false  },
    ],
  },
  {
    ano: '5° año',
    materias: [
      { id: 31, titulo: 'Inteligencia Artificial', correlativas: [28],  aprobada: false  },
      { id: 32, titulo: 'Ciencia de Datos', correlativas: [28],  aprobada: false  },
      { id: 33, titulo: 'Sistemas de Gestión', correlativas: [18, 27],  aprobada: false  },
      { id: 34, titulo: 'Gestión Gerencial', correlativas: [24, 30],  aprobada: false  },
      { id: 35, titulo: 'Seguridad en los Sistemas de Información', correlativas: [26, 30],  aprobada: false  },
      { id: 36, titulo: 'Proyecto Final (Integradora)', correlativas: [25, 26, 30],  aprobada: false  },
    ],
  },
];

export default materiasArray;
