import { PrismaClient, Role, StudentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de AulaControl...");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@aulacontrol.do" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@aulacontrol.do",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Usuario admin creado: ${admin.email}`);

  // ── Sample school ───────────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { id: "school-demo-001" },
    update: {},
    create: {
      id: "school-demo-001",
      name: "Escuela Primaria San Juan",
      address: "Calle Duarte #45, Santo Domingo, República Dominicana",
      phone: "809-555-0100",
    },
  });
  console.log(`✅ Escuela creada: ${school.name}`);

  // ── Admin as school member ──────────────────────────────────────────────────
  await prisma.schoolMember.upsert({
    where: {
      userId_schoolId: {
        userId: admin.id,
        schoolId: school.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      schoolId: school.id,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin vinculado a la escuela");

  // ── Courses 1º–6º with section A ───────────────────────────────────────────
  // Año escolar República Dominicana: agosto → junio
  const courseNames = [
    { name: "1º Grado", level: "Primaria" },
    { name: "2º Grado", level: "Primaria" },
    { name: "3º Grado", level: "Primaria" },
    { name: "4º Grado", level: "Primaria" },
    { name: "5º Grado", level: "Primaria" },
    { name: "6º Grado", level: "Primaria" },
  ];

  for (const { name, level } of courseNames) {
    const course = await prisma.course.upsert({
      where: {
        // Use a stable synthetic id for idempotency
        id: `course-${school.id}-${name.replace(/\s/g, "-").toLowerCase()}`,
      },
      update: {},
      create: {
        id: `course-${school.id}-${name.replace(/\s/g, "-").toLowerCase()}`,
        schoolId: school.id,
        name,
        level,
      },
    });

    const section = await prisma.section.upsert({
      where: {
        id: `section-${course.id}-A`,
      },
      update: {},
      create: {
        id: `section-${course.id}-A`,
        courseId: course.id,
        name: "A",
      },
    });

    console.log(`  📚 ${course.name} – Sección ${section.name}`);
  }

  // ── Sample subjects ─────────────────────────────────────────────────────────
  const subjectNames = [
    "Lengua Española",
    "Matemáticas",
    "Ciencias Naturales",
    "Ciencias Sociales",
    "Educación Física",
    "Educación Artística",
  ];

  for (const name of subjectNames) {
    await prisma.subject.upsert({
      where: {
        id: `subject-${school.id}-${name.replace(/\s/g, "-").toLowerCase()}`,
      },
      update: {},
      create: {
        id: `subject-${school.id}-${name.replace(/\s/g, "-").toLowerCase()}`,
        schoolId: school.id,
        name,
      },
    });
  }
  console.log(`✅ ${subjectNames.length} materias de ejemplo creadas`);

  console.log("\n🎉 Seed completado exitosamente.");
  console.log("─────────────────────────────────────────");
  console.log(`  Admin email : admin@aulacontrol.do`);
  console.log(`  Admin pass  : Admin123!`);
  console.log(`  Escuela     : ${school.name}`);
  console.log(`  Cursos      : 1º–6º Grado (sección A cada uno)`);
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
