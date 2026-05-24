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

function seedUsuarios() {
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

  saveData().then(() => {
    renderUsuarios();
    renderDashboard();
    renderHistorial();
    toast('100 usuarios de prueba generados con lecturas de enero a mayo');
  });
}
