export interface Symptom {
  id: string;
  label: string;
  priceMin: number;
  priceMax: number;
  severity: 'low' | 'medium' | 'high' | 'emergency';
}

export interface SymptomCategory {
  id: string;
  name: string;
  emoji: string;
  symptoms: Symptom[];
}

export const symptomCategories: SymptomCategory[] = [
  {
    id: 'electrical',
    name: 'Electrical & Battery',
    emoji: '🔋',
    symptoms: [
      { id: 'battery_dead', label: 'Battery completely dead', priceMin: 400, priceMax: 800, severity: 'high' },
      { id: 'slow_cranking', label: 'Slow cranking / weak start', priceMin: 300, priceMax: 600, severity: 'medium' },
      { id: 'dashboard_dim', label: 'Dashboard lights dimming', priceMin: 200, priceMax: 500, severity: 'medium' },
      { id: 'headlights_dim', label: 'Headlights very dim/weak', priceMin: 200, priceMax: 400, severity: 'medium' },
      { id: 'lights_dead', label: 'All lights not working', priceMin: 300, priceMax: 700, severity: 'high' },
      { id: 'horn_dead', label: 'Horn not working', priceMin: 150, priceMax: 400, severity: 'low' },
      { id: 'power_windows_stuck', label: 'Power windows stuck', priceMin: 200, priceMax: 500, severity: 'low' },
      { id: 'central_locking_failed', label: 'Central locking failed', priceMin: 300, priceMax: 600, severity: 'medium' },
      { id: 'infotainment_dead', label: 'Infotainment screen dead', priceMin: 200, priceMax: 500, severity: 'low' },
      { id: 'blower_dead', label: 'AC/Heater blower not working', priceMin: 300, priceMax: 700, severity: 'medium' },
      { id: 'alternator_warning', label: 'Alternator warning light ON', priceMin: 500, priceMax: 1200, severity: 'high' },
      { id: 'electrical_smell', label: 'Electrical burning smell', priceMin: 400, priceMax: 1000, severity: 'emergency' },
    ],
  },
  {
    id: 'tires_wheels',
    name: 'Tires & Wheels',
    emoji: '🛞',
    symptoms: [
      { id: 'flat_tire', label: 'Flat tire (punctured)', priceMin: 200, priceMax: 400, severity: 'medium' },
      { id: 'spare_flat', label: 'Spare tire also flat', priceMin: 200, priceMax: 400, severity: 'high' },
      { id: 'wheel_locked', label: 'Wheel completely locked', priceMin: 300, priceMax: 600, severity: 'high' },
      { id: 'tire_burst', label: 'Tire burst while driving', priceMin: 400, priceMax: 800, severity: 'emergency' },
      { id: 'multiple_flat', label: 'Multiple flat tires', priceMin: 400, priceMax: 800, severity: 'emergency' },
      { id: 'wheel_nuts_loose', label: 'Wheel nuts loose/broken', priceMin: 150, priceMax: 300, severity: 'high' },
      { id: 'jack_broken', label: 'Jack broken/not available', priceMin: 100, priceMax: 250, severity: 'medium' },
      { id: 'spare_missing', label: 'Spare tire missing', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'rim_damaged', label: 'Wheel rim damaged', priceMin: 500, priceMax: 2000, severity: 'medium' },
      { id: 'tread_worn', label: 'Tire tread completely worn', priceMin: 300, priceMax: 800, severity: 'medium' },
    ],
  },
  {
    id: 'engine',
    name: 'Engine & Starting',
    emoji: '⚙️',
    symptoms: [
      { id: 'no_crank', label: "Engine won't start (no crank)", priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'cranks_no_start', label: "Engine cranks but won't start", priceMin: 400, priceMax: 1200, severity: 'high' },
      { id: 'engine_cuts_off', label: 'Engine cuts off while driving', priceMin: 500, priceMax: 1500, severity: 'emergency' },
      { id: 'engine_knocking', label: 'Engine making loud knocking', priceMin: 800, priceMax: 2000, severity: 'high' },
      { id: 'engine_clicking', label: 'Engine making clicking noise', priceMin: 300, priceMax: 800, severity: 'medium' },
      { id: 'engine_rattling', label: 'Engine rattling at idle', priceMin: 400, priceMax: 1000, severity: 'medium' },
      { id: 'engine_misfiring', label: 'Engine misfiring/jerking', priceMin: 500, priceMax: 1200, severity: 'medium' },
      { id: 'power_lost', label: 'Engine power completely lost', priceMin: 600, priceMax: 2000, severity: 'emergency' },
      { id: 'revving_no_move', label: 'Engine revving but no movement', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'starter_grinding', label: 'Starter motor grinding', priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'belt_squealing', label: 'Engine belt squealing', priceMin: 300, priceMax: 800, severity: 'medium' },
      { id: 'timing_belt_broken', label: 'Timing belt broken', priceMin: 1000, priceMax: 3000, severity: 'emergency' },
      { id: 'oil_leaking', label: 'Engine oil leaking badly', priceMin: 400, priceMax: 1200, severity: 'high' },
      { id: 'blue_white_smoke', label: 'Blue/white smoke from exhaust', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'black_smoke', label: 'Black smoke from exhaust', priceMin: 400, priceMax: 1200, severity: 'medium' },
      { id: 'engine_shaking', label: 'Engine shaking violently', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'check_engine_flash', label: 'Check engine light flashing', priceMin: 300, priceMax: 800, severity: 'high' },
      { id: 'temp_gauge_max', label: 'Engine temperature gauge max', priceMin: 400, priceMax: 1000, severity: 'emergency' },
      { id: 'no_oil_pressure', label: 'No oil pressure warning', priceMin: 500, priceMax: 1500, severity: 'emergency' },
      { id: 'fuel_smell_engine', label: 'Fuel smell from engine', priceMin: 400, priceMax: 1000, severity: 'emergency' },
    ],
  },
  {
    id: 'brakes',
    name: 'Brakes & Clutch',
    emoji: '🛑',
    symptoms: [
      { id: 'brakes_failed', label: 'Brakes completely failed', priceMin: 800, priceMax: 2000, severity: 'emergency' },
      { id: 'pedal_to_floor', label: 'Brake pedal goes to floor', priceMin: 500, priceMax: 1200, severity: 'emergency' },
      { id: 'pedal_hard_spongy', label: 'Brake pedal hard/spongy', priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'brakes_grinding', label: 'Brakes making grinding noise', priceMin: 500, priceMax: 1200, severity: 'high' },
      { id: 'abs_warning', label: 'ABS warning light flashing', priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'handbrake_stuck', label: 'Handbrake stuck/released', priceMin: 300, priceMax: 700, severity: 'medium' },
      { id: 'brake_fluid_leak', label: 'Brake fluid leaking', priceMin: 400, priceMax: 1000, severity: 'emergency' },
      { id: 'clutch_stuck', label: 'Clutch pedal stuck/not working', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'clutch_slipping', label: 'Clutch slipping', priceMin: 600, priceMax: 2000, severity: 'high' },
      { id: 'gear_not_engaging', label: 'Gear not engaging (manual)', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'car_rolling', label: 'Car rolling on slopes', priceMin: 300, priceMax: 800, severity: 'medium' },
      { id: 'brake_overheat', label: 'Brake overheating smell', priceMin: 400, priceMax: 1000, severity: 'high' },
    ],
  },
  {
    id: 'transmission',
    name: 'Transmission & Gearbox',
    emoji: '🏎️',
    symptoms: [
      { id: 'auto_trans_stuck', label: 'Automatic transmission stuck', priceMin: 800, priceMax: 3000, severity: 'high' },
      { id: 'wont_change_gears', label: "Won't change gears (auto/manual)", priceMin: 600, priceMax: 2000, severity: 'high' },
      { id: 'gear_slipping', label: 'Gear slipping out of position', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'trans_whining', label: 'Transmission making whining', priceMin: 400, priceMax: 1200, severity: 'medium' },
      { id: 'gearbox_oil_leak', label: 'Gearbox oil leaking', priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'wont_move_any_gear', label: "Car won't move in any gear", priceMin: 800, priceMax: 3000, severity: 'emergency' },
      { id: 'reverse_broken', label: 'Reverse gear not working', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'harsh_shifts', label: 'Harsh gear shifts', priceMin: 400, priceMax: 1000, severity: 'medium' },
      { id: 'trans_warning', label: 'Transmission warning light ON', priceMin: 400, priceMax: 1200, severity: 'high' },
      { id: 'gear_cable_broken', label: 'Gear selector cable broken', priceMin: 500, priceMax: 1200, severity: 'high' },
    ],
  },
  {
    id: 'cooling',
    name: 'Cooling System',
    emoji: '🌡️',
    symptoms: [
      { id: 'overheating', label: 'Engine overheating (needle max)', priceMin: 400, priceMax: 1000, severity: 'emergency' },
      { id: 'radiator_boiling', label: 'Radiator boiling/steam', priceMin: 400, priceMax: 1000, severity: 'emergency' },
      { id: 'coolant_leak', label: 'Coolant leaking from radiator', priceMin: 300, priceMax: 800, severity: 'high' },
      { id: 'water_pump_fail', label: 'Water pump failed', priceMin: 600, priceMax: 1500, severity: 'high' },
      { id: 'thermostat_stuck', label: 'Thermostat stuck closed', priceMin: 300, priceMax: 700, severity: 'medium' },
      { id: 'rad_fan_dead', label: 'Radiator fan not spinning', priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'hoses_burst', label: 'Hoses burst/cracked', priceMin: 300, priceMax: 800, severity: 'high' },
      { id: 'coolant_empty', label: 'Coolant reservoir empty', priceMin: 200, priceMax: 500, severity: 'medium' },
      { id: 'ac_overheating', label: 'AC gas causing overheating', priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'temp_erratic', label: 'Temperature gauge erratic', priceMin: 300, priceMax: 700, severity: 'medium' },
    ],
  },
  {
    id: 'fuel',
    name: 'Fuel System',
    emoji: '⛽',
    symptoms: [
      { id: 'out_of_fuel', label: 'Car completely out of fuel', priceMin: 200, priceMax: 400, severity: 'medium' },
      { id: 'fuel_pump_dead', label: 'Fuel pump not working', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'fuel_gauge_empty', label: 'Fuel gauge showing empty', priceMin: 200, priceMax: 500, severity: 'low' },
      { id: 'fuel_tank_leak', label: 'Fuel tank leaking', priceMin: 500, priceMax: 1500, severity: 'emergency' },
      { id: 'injectors_clogged', label: 'Injectors clogged/blocked', priceMin: 400, priceMax: 1200, severity: 'medium' },
      { id: 'carburetor_flood', label: 'Carburetor flooding', priceMin: 300, priceMax: 800, severity: 'medium' },
      { id: 'fuel_filter_blocked', label: 'Fuel filter blocked', priceMin: 200, priceMax: 500, severity: 'medium' },
      { id: 'petrol_smell_cabin', label: 'Petrol smell inside cabin', priceMin: 300, priceMax: 800, severity: 'emergency' },
    ],
  },
  {
    id: 'ac',
    name: 'AC & Climate Control',
    emoji: '❄️',
    symptoms: [
      { id: 'ac_no_cooling', label: 'AC completely not cooling', priceMin: 400, priceMax: 1200, severity: 'medium' },
      { id: 'ac_hot_air', label: 'AC blowing hot air', priceMin: 400, priceMax: 1000, severity: 'medium' },
      { id: 'ac_compressor_off', label: 'AC compressor not engaging', priceMin: 500, priceMax: 1500, severity: 'medium' },
      { id: 'ac_gas_leaked', label: 'AC gas completely leaked', priceMin: 500, priceMax: 1200, severity: 'medium' },
      { id: 'ac_noise', label: 'AC making unusual noise', priceMin: 300, priceMax: 800, severity: 'low' },
      { id: 'heater_dead', label: 'Heater not working (winter)', priceMin: 300, priceMax: 800, severity: 'medium' },
      { id: 'evaporator_leak', label: 'AC evaporator leaking water', priceMin: 400, priceMax: 1000, severity: 'medium' },
      { id: 'cabin_blower_dead', label: 'Cabin blower dead', priceMin: 300, priceMax: 700, severity: 'medium' },
    ],
  },
  {
    id: 'suspension',
    name: 'Suspension & Steering',
    emoji: '🛠️',
    symptoms: [
      { id: 'steering_locked', label: 'Steering completely locked', priceMin: 500, priceMax: 1500, severity: 'emergency' },
      { id: 'power_steering_fail', label: 'Power steering failed', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'steering_vibrating', label: 'Steering wheel vibrating badly', priceMin: 300, priceMax: 800, severity: 'medium' },
      { id: 'pulling_one_side', label: 'Car pulling to one side', priceMin: 300, priceMax: 700, severity: 'medium' },
      { id: 'shock_leaking', label: 'Shock absorbers leaking', priceMin: 500, priceMax: 1500, severity: 'medium' },
      { id: 'suspension_clunking', label: 'Suspension making clunking', priceMin: 400, priceMax: 1000, severity: 'medium' },
      { id: 'alignment_off', label: 'Wheel alignment completely off', priceMin: 300, priceMax: 600, severity: 'medium' },
      { id: 'ball_joint_broken', label: 'Ball joint broken', priceMin: 500, priceMax: 1200, severity: 'high' },
      { id: 'control_arm_damaged', label: 'Control arm damaged', priceMin: 600, priceMax: 1500, severity: 'high' },
      { id: 'steering_rack_leak', label: 'Steering rack leaking', priceMin: 500, priceMax: 1500, severity: 'high' },
      { id: 'tie_rod_broken', label: 'Tie rod end broken', priceMin: 400, priceMax: 1000, severity: 'high' },
      { id: 'car_leaning', label: 'Car leaning to one side', priceMin: 400, priceMax: 1200, severity: 'medium' },
    ],
  },
  {
    id: 'body',
    name: 'Body & Exterior',
    emoji: '🚗',
    symptoms: [
      { id: 'door_locked_inside', label: "Door won't open (locked inside)", priceMin: 200, priceMax: 500, severity: 'medium' },
      { id: 'boot_stuck', label: "Boot/trunk won't open", priceMin: 200, priceMax: 500, severity: 'low' },
      { id: 'fuel_lid_stuck', label: 'Fuel lid stuck', priceMin: 100, priceMax: 300, severity: 'low' },
      { id: 'wiper_failed', label: 'Windshield wiper failed', priceMin: 200, priceMax: 500, severity: 'medium' },
      { id: 'rear_wiper_dead', label: 'Rear wiper motor dead', priceMin: 200, priceMax: 500, severity: 'low' },
      { id: 'mirror_failed', label: 'Side mirror adjustment failed', priceMin: 200, priceMax: 500, severity: 'low' },
      { id: 'sunroof_stuck', label: 'Sunroof stuck open/closed', priceMin: 300, priceMax: 800, severity: 'medium' },
      { id: 'antenna_stuck', label: 'Antenna stuck', priceMin: 100, priceMax: 300, severity: 'low' },
      { id: 'fuel_cap_missing', label: 'Fuel cap missing', priceMin: 100, priceMax: 250, severity: 'low' },
      { id: 'accident_damage', label: 'Exterior damage (accident)', priceMin: 500, priceMax: 5000, severity: 'high' },
    ],
  },
  {
    id: 'emergency',
    name: 'Emergency / Unknown',
    emoji: '🚨',
    symptoms: [
      { id: 'car_stopped', label: 'Car stopped suddenly', priceMin: 500, priceMax: 2000, severity: 'emergency' },
      { id: 'total_electrical_fail', label: 'Complete electrical failure', priceMin: 500, priceMax: 2000, severity: 'emergency' },
      { id: 'car_on_fire', label: 'Car on fire (smoke/flames)', priceMin: 1000, priceMax: 5000, severity: 'emergency' },
      { id: 'accident_cant_drive', label: "Accident - can't drive", priceMin: 800, priceMax: 5000, severity: 'emergency' },
      { id: 'flood_damage', label: 'Flood water damage', priceMin: 500, priceMax: 3000, severity: 'emergency' },
      { id: 'pothole_hit', label: 'Car hit pothole hard', priceMin: 300, priceMax: 1500, severity: 'high' },
      { id: 'unknown_wont_move', label: "Unknown - won't move", priceMin: 500, priceMax: 2000, severity: 'high' },
      { id: 'multiple_systems_fail', label: 'Multiple systems failed', priceMin: 800, priceMax: 3000, severity: 'emergency' },
      { id: 'all_warning_lights', label: 'Dashboard all warning lights', priceMin: 400, priceMax: 1500, severity: 'high' },
      { id: 'strange_smell', label: 'Strange smell (petrol/oil/burn)', priceMin: 300, priceMax: 1000, severity: 'high' },
      { id: 'very_loud_noise', label: 'Car making very loud noise', priceMin: 400, priceMax: 1500, severity: 'high' },
      { id: 'trans_dead', label: 'Transmission completely dead', priceMin: 800, priceMax: 3000, severity: 'emergency' },
      { id: 'brakes_steering_fail', label: 'Brakes + steering failed', priceMin: 1000, priceMax: 3000, severity: 'emergency' },
      { id: 'stranded_water', label: 'Car stranded in water', priceMin: 800, priceMax: 3000, severity: 'emergency' },
      { id: 'need_towing', label: 'Need towing only', priceMin: 500, priceMax: 1500, severity: 'high' },
    ],
  },
];

// Helper to compute price estimate from selected symptom IDs
export function computePriceEstimate(selectedIds: string[]): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const cat of symptomCategories) {
    for (const s of cat.symptoms) {
      if (selectedIds.includes(s.id)) {
        min += s.priceMin;
        max += s.priceMax;
      }
    }
  }
  return { min, max };
}

// Helper to get highest severity from selections
export function computeSeverity(selectedIds: string[]): 'low' | 'medium' | 'high' | 'emergency' {
  const order: Record<string, number> = { low: 0, medium: 1, high: 2, emergency: 3 };
  let highest = 0;
  for (const cat of symptomCategories) {
    for (const s of cat.symptoms) {
      if (selectedIds.includes(s.id)) {
        highest = Math.max(highest, order[s.severity]);
      }
    }
  }
  return (['low', 'medium', 'high', 'emergency'] as const)[highest];
}

// Get category for a service type
export function getCategoryForService(serviceType: string): string | null {
  const map: Record<string, string> = {
    puncture: 'tires_wheels',
    battery: 'electrical',
    towing: 'emergency',
    engine: 'engine',
    general: '',
    ac: 'ac',
    brakes: 'brakes',
    oil: 'engine',
  };
  return map[serviceType] ?? null;
}
