const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Read .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log("--- 1. Setting up Demo Staff Account ---");
  const demoEmail = "demo@laptopdoctor.ai";
  const demoPassword = "demo123456";

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    process.exit(1);
  }

  let demoUser = usersData.users.find((u) => u.email === demoEmail);

  if (!demoUser) {
    console.log("Creating new user demo@laptopdoctor.ai...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { full_name: "Staff Demo", role: "admin" },
    });
    if (createError) {
      console.error("Failed to create demo user:", createError);
      process.exit(1);
    }
    demoUser = newUser.user;
    console.log("Demo user created successfully, ID:", demoUser.id);
  } else {
    console.log("Existing demo user found, updating password...", demoUser.id);
    const { error: updateError } = await supabase.auth.admin.updateUserById(demoUser.id, {
      password: demoPassword,
      email_confirm: true,
      user_metadata: { full_name: "Staff Demo", role: "admin" },
    });
    if (updateError) {
      console.error("Failed to update demo user password:", updateError);
    } else {
      console.log("Updated password for demo user successfully.");
    }
  }

  // Insert/upsert into profiles table
  console.log("Upserting profile for demo user...");
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: demoUser.id,
      role: "admin",
      status: "aktif",
      full_name: "Staff Demo",
    })
    .select();

  if (profileError) {
    console.error("Error upserting profile:", profileError);
  } else {
    console.log("Profile upserted successfully:", profileData);
  }

  console.log("\n--- 2. Seeding Sparepart Catalog ---");
  // Check current spareparts
  const { data: existingParts, error: fetchErr } = await supabase
    .from("sparepart_catalog")
    .select("*");
  console.log("Current spareparts count:", existingParts ? existingParts.length : 0);

  // Clear existing spareparts
  const { error: deleteErr } = await supabase
    .from("sparepart_catalog")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (deleteErr) {
    console.error("Error clearing sparepart_catalog:", deleteErr);
  } else {
    console.log("Cleared existing sparepart catalog.");
  }

  const sampleSpareparts = [
    {
      name: "RAM Laptop DDR4 8GB 3200MHz",
      category: "RAM",
      price_note: "Rp 320.000 (Garansi 1 Tahun)",
      is_available: true,
      image_url: null,
    },
    {
      name: "RAM Laptop DDR4 16GB 3200MHz",
      category: "RAM",
      price_note: "Rp 580.000 (Garansi 1 Tahun)",
      is_available: true,
      image_url: null,
    },
    {
      name: "SSD NVMe M.2 256GB High-Speed",
      category: "SSD",
      price_note: "Rp 395.000 (Termasuk Pasang & OS)",
      is_available: true,
      image_url: null,
    },
    {
      name: "SSD NVMe M.2 512GB High-Speed",
      category: "SSD",
      price_note: "Rp 650.000 (Termasuk Pasang & OS)",
      is_available: true,
      image_url: null,
    },
    {
      name: "Baterai Laptop Universal Series 4-Cell",
      category: "Baterai",
      price_note: "Estimasi Rp 350.000 - Rp 450.000 (Garansi 6 Bulan)",
      is_available: true,
      image_url: null,
    },
    {
      name: "Baterai Laptop Gaming High-Capacity",
      category: "Baterai",
      price_note: "Estimasi Rp 550.000 - Rp 700.000 (Garansi 6 Bulan)",
      is_available: true,
      image_url: null,
    },
    {
      name: "Keyboard Laptop Slim Chiclet (Frame Black)",
      category: "Keyboard",
      price_note: "Rp 210.000 (Free Pasang)",
      is_available: true,
      image_url: null,
    },
    {
      name: "Keyboard Laptop Backlight Universal",
      category: "Keyboard",
      price_note: "Rp 290.000 (Free Pasang)",
      is_available: true,
      image_url: null,
    },
    {
      name: "Thermal Paste High Performance 4gr",
      category: "Lainnya",
      price_note: "Rp 85.000 (Bonus Cleaning Fans)",
      is_available: true,
      image_url: null,
    },
    {
      name: "Adaptor Charger Laptop Universal 65W Smart",
      category: "Lainnya",
      price_note: "Rp 225.000 (Garansi 3 Bulan)",
      is_available: true,
      image_url: null,
    },
  ];

  const { data: insertedParts, error: insertErr } = await supabase
    .from("sparepart_catalog")
    .insert(sampleSpareparts)
    .select();

  if (insertErr) {
    console.error("Error inserting sparepart catalog sample data:", insertErr);
  } else {
    console.log(`Inserted ${insertedParts.length} sample spareparts successfully.`);
  }

  console.log("Done!");
}

main();
