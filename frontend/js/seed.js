const NOMBRES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'José', 'Carmen', 'Luis', 'Sofía',
  'Miguel', 'Elena', 'Antonio', 'Rosa', 'Francisco', 'Marta', 'Jorge', 'Patricia', 'Ricardo', 'Silvia',
  'Daniel', 'Verónica', 'Alejandro', 'Gabriela', 'Pablo', 'Andrea', 'Fernando', 'Liliana', 'Hugo', 'Mónica',
  'Sergio', 'Beatriz', 'Raúl', 'Adriana', 'Alberto', 'Claudia', 'Manuel', 'Cristina', 'Diego', 'Alicia',
  'Oscar', 'Valeria', 'Eduardo', 'Florencia', 'Julio', 'Paola', 'Gustavo', 'Marina', 'Roberto', 'Lorena',
  'Víctor', 'Yolanda', 'Rodrigo', 'Araceli', 'Emilio', 'Graciela', 'Marcos', 'Noemí', 'Adrián', 'Susana',
  'Iván', 'Ruth', 'Enrique', 'Miriam', 'Mario', 'Estela', 'David', 'Alicia', 'Alfredo', 'Natalia',
  'Rubén', 'Lidia', 'Tomás', 'Cecilia', 'Ángel', 'Elsa', 'Ramón', 'Leticia', 'Javier', 'Berta',
  'Félix', 'Luz', 'Salvador', 'Inés', 'Héctor', 'Sara', 'Mauro', 'Diana', 'Isaac', 'Lourdes',
  'Vicente', 'Rita', 'Ernesto', 'Celia', 'Esteban', 'Olga', 'Néstor', 'Teresa', 'Martín', 'Aurora'
];

const APELLIDOS = [
  'González', 'Rodríguez', 'Martínez', 'López', 'Fernández', 'Pérez', 'García', 'Sánchez', 'Ramírez', 'Torres',
  'Riveros', 'Benítez', 'Villalba', 'Acosta', 'Bareiro', 'Ortiz', 'Duarte', 'Giménez', 'Rojas', 'Bogado',
  'Cabrera', 'Fleitas', 'Vera', 'Cáceres', 'Ayala', 'Mendoza', 'Aguilera', 'Ríos', 'Mora', 'Dávalos',
  'Marecos', 'Báez', 'Britez', 'Ojeda', 'Barrios', 'Román', 'Galeano', 'Leiva', 'Espinoza', 'Gómez',
  'González', 'Rodríguez', 'Martínez', 'López', 'Fernández', 'Pérez', 'García', 'Sánchez', 'Ramírez', 'Torres',
  'Riveros', 'Benítez', 'Villalba', 'Acosta', 'Bareiro', 'Ortiz', 'Duarte', 'Giménez', 'Rojas', 'Bogado',
  'Cabrera', 'Fleitas', 'Vera', 'Cáceres', 'Ayala', 'Mendoza', 'Aguilera', 'Ríos', 'Mora', 'Dávalos',
  'Marecos', 'Báez', 'Britez', 'Ojeda', 'Barrios', 'Román', 'Galeano', 'Leiva', 'Espinoza', 'Gómez',
  'Acosta', 'Bareiro', 'Ortiz', 'Duarte', 'Giménez', 'Rojas', 'Bogado', 'Cabrera', 'Fleitas', 'Vera',
  'Cáceres', 'Ayala', 'Mendoza', 'Aguilera', 'Ríos', 'Mora', 'Dávalos', 'Marecos', 'Báez', 'Britez'
];

function generarTelefono() {
  const prefijos = ['0981', '0982', '0983', '0985', '0971', '0972', '0991', '0992'];
  const n = String(Math.floor(1000000 + Math.random() * 9000000));
  return prefijos[Math.floor(Math.random() * prefijos.length)] + ' ' + n;
}

async function seedUsuarios() {
  if (!currentUser || currentUser.role !== 'admin') { toast('Solo el administrador puede generar datos de prueba.'); return; }
  if (usuarios.length > 0 && !confirm('Ya hay usuarios registrados. ¿Agregar 100 usuarios de prueba igual?')) return;

  const nuevos = [];
  for (let i = 0; i < 100; i++) {
    const nombre = NOMBRES[i % NOMBRES.length];
    const apellido = APELLIDOS[i % APELLIDOS.length];
    const num = i + 1;
    nuevos.push({
      id: 'seed-' + Date.now() + '-' + i,
      nombre,
      apellido,
      medidor: 'MED-' + String(num).padStart(3, '0'),
      direccion: 'Lote ' + num + ', Barrio Ytororo',
      telefono: generarTelefono(),
      lecIni: Math.floor(Math.random() * 20)
    });
  }

  for (const u of nuevos) {
    if (!usuarios.find(x => x.medidor === u.medidor)) {
      usuarios.push(u);
    }
  }

  lecturas = [];
  const anio = 2026;
  const meses = [1, 2, 3, 4, 5];
  for (const u of usuarios) {
    let anterior = u.lecIni || 0;
    for (const mes of meses) {
      const actual = anterior + Math.round((5 + Math.random() * 25) * 10) / 10;
      const consumo = actual - anterior;
      const importe = calcTarifa(consumo);
      lecturas.push({
        id: 'seed-l-' + u.id + '-' + mes,
        usuarioId: u.id,
        mes,
        anio,
        anterior,
        actual,
        consumo: Math.round(consumo * 100) / 100,
        importe: Math.round(importe),
        fecha: new Date(anio, mes - 1, Math.floor(1 + Math.random() * 25)).toISOString()
      });
      anterior = actual;
    }
  }

  await seedNoticias();
  await saveData();
  renderUsuarios();
  renderDashboard();
  renderHistorial();
  toast('Usuarios y noticias de prueba generados');
}

async function seedNoticias() {
  const ejemplos = [
    {
      titulo: 'Corte de agua programado',
      tipo: 'corte',
      contenido: 'Se informa a todos los socios que el día martes 26 de mayo se realizará un corte programado del suministro de agua desde las 08:00 hasta las 12:00 horas por trabajos de mantenimiento en la red principal. Se recomienda tomar las precauciones necesarias y almacenar agua con anticipación. Disculpe las molestias.',
      fecha: new Date(2026, 4, 25, 10, 0).toISOString()
    },
    {
      titulo: 'Mantenimiento en red principal',
      tipo: 'mantenimiento',
      contenido: 'Se están realizando trabajos de reparación en la red principal sobre la Av. Ytororo. Durante el día de hoy podrían registrarse bajas de presión en el suministro. Agradecemos su paciencia mientras trabajamos para mejorar el servicio.',
      fecha: new Date(2026, 4, 22, 8, 30).toISOString()
    },
    {
      titulo: 'Convocatoria a asamblea general ordinaria',
      tipo: 'asamblea',
      contenido: 'Se convoca a todos los socios de la Junta de Saneamiento a la asamblea general ordinaria que se llevará a cabo el día lunes 15 de junio a las 19:00 horas en el local de la junta. Se tratarán temas importantes como balance general, proyectos de mejora y renovación de comisión. Esperamos contar con su presencia.',
      fecha: new Date(2026, 4, 20, 15, 0).toISOString()
    },
    {
      titulo: 'Horario de atención al público',
      tipo: 'general',
      contenido: 'Recordamos a todos los usuarios que el horario de atención al público en la oficina de la Junta de Saneamiento es de lunes a viernes de 07:00 a 12:00 y de 14:00 a 17:00 horas. Para reclamos y consultas también pueden comunicarse al teléfono 0981 000 000.',
      fecha: new Date(2026, 4, 18, 9, 0).toISOString()
    },
    {
      titulo: 'Recordatorio de pago mensual',
      tipo: 'general',
      contenido: 'Se recuerda a todos los usuarios que el vencimiento para el pago del servicio corresponde al día 10 de cada mes. Los pagos realizados después de esa fecha estarán sujetos a un recargo del 10% por mora según lo establecido en el reglamento. Acercarse a la oficina con su número de medidor.',
      fecha: new Date(2026, 4, 15, 11, 0).toISOString()
    }
  ];

  for (const ej of ejemplos) {
    const n = { id: 'seed-noti-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), ...ej, activa: true };
    if (!noticias.find(x => x.titulo === ej.titulo)) {
      noticias.push(n);
      await dbAPI.put('noticias', n);
    }
  }

  renderNoticiasPublic();
  if (currentUser) renderNoticiasAdmin();
}
