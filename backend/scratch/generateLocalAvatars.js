const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 15 distinct premium gradients & designs for local SVG avatars
const avatars = [
  // Mentors
  { id: 1, name: 'Dr. Aarav Patel', color1: '#4F46E5', color2: '#7C3AED', sex: 'm' },
  { id: 2, name: 'Priya Sharma', color1: '#EC4899', color2: '#F43F5E', sex: 'f' },
  { id: 3, name: 'Rohan Mehta', color1: '#06B6D4', color2: '#3B82F6', sex: 'm' },
  { id: 4, name: 'Sneha Gupta', color1: '#10B981', color2: '#059669', sex: 'f' },
  { id: 5, name: 'Amit Verma', color1: '#F59E0B', color2: '#D97706', sex: 'm' },
  
  // Alumni
  { id: 6, name: 'Kunal Joshi', color1: '#2563EB', color2: '#1D4ED8', sex: 'm' },
  { id: 7, name: 'Anjali Desai', color1: '#DB2777', color2: '#9D174D', sex: 'f' },
  { id: 8, name: 'Vikram Singh', color1: '#0F766E', color2: '#115E59', sex: 'm' },
  { id: 9, name: 'Neha Ranade', color1: '#BE185D', color2: '#9D174D', sex: 'f' },
  { id: 10, name: 'Sanjay Nair', color1: '#B45309', color2: '#92400E', sex: 'm' },
  
  // Students
  { id: 11, name: 'Aditya Rao', color1: '#6366F1', color2: '#4F46E5', sex: 'm' },
  { id: 12, name: 'Diya Sen', color1: '#F472B6', color2: '#EC4899', sex: 'f' },
  { id: 13, name: 'Kabir Kapoor', color1: '#38BDF8', color2: '#0284C7', sex: 'm' },
  { id: 14, name: 'Riya Singhal', color1: '#34D399', color2: '#059669', sex: 'f' },
  { id: 15, name: 'Varun Joshi', color1: '#FBBF24', color2: '#F59E0B', sex: 'm' }
];

const generateSVG = (av) => {
  const isMale = av.sex === 'm';
  
  // High-fidelity modern flat design vector portrait elements
  const faceColor = '#FFE0BD';
  const hairColor = isMale ? '#2D3748' : '#4A5568';
  const shirtColor = '#FFFFFF';
  
  const maleHair = `
    <path d="M30 40 C30 20, 70 20, 70 40 C75 40, 75 35, 70 30 C65 20, 35 20, 30 30 C25 35, 25 40, 30 40 Z" fill="${hairColor}" />
    <rect x="28" y="38" width="6" height="12" rx="2" fill="${hairColor}" />
    <rect x="66" y="38" width="6" height="12" rx="2" fill="${hairColor}" />
  `;

  const femaleHair = `
    <path d="M25 45 C25 15, 75 15, 75 45 C80 50, 75 70, 75 75 C70 70, 70 50, 70 45 C70 30, 30 30, 30 45 C30 50, 30 70, 25 75 C25 70, 20 50, 25 45 Z" fill="${hairColor}" />
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="150" height="150">
      <defs>
        <linearGradient id="grad-${av.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${av.color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${av.color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background Circle with vibrant gradient -->
      <circle cx="50" cy="50" r="48" fill="url(#grad-${av.id})" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
      
      <!-- Neck -->
      <rect x="44" y="55" width="12" height="15" rx="3" fill="#E0AC69" />
      
      <!-- Shirt collar -->
      <path d="M30 70 L70 70 L65 85 L35 85 Z" fill="${shirtColor}" />
      <path d="M40 70 L50 80 L60 70" fill="none" stroke="#E2E8F0" stroke-width="2" />
      
      <!-- Face -->
      <circle cx="50" cy="45" r="18" fill="${faceColor}" />
      
      <!-- Hair selection -->
      ${isMale ? maleHair : femaleHair}
      
      <!-- Eyes -->
      <circle cx="44" cy="43" r="2" fill="#2D3748" />
      <circle cx="56" cy="43" r="2" fill="#2D3748" />
      
      <!-- Smile -->
      <path d="M46 50 Q50 54 54 50" fill="none" stroke="#2D3748" stroke-width="2" stroke-linecap="round" />
      
      <!-- Glasses for Aarav (ID 1) -->
      ${av.id === 1 ? `
        <circle cx="43" cy="43" r="4" fill="none" stroke="#D97706" stroke-width="1.5" />
        <circle cx="57" cy="43" r="4" fill="none" stroke="#D97706" stroke-width="1.5" />
        <line x1="47" y1="43" x2="53" y2="43" stroke="#D97706" stroke-width="1.5" />
      ` : ''}
    </svg>
  `.trim();
};

console.log('Generating local SVG avatars...');
avatars.forEach(av => {
  const svgContent = generateSVG(av);
  const filePath = path.join(uploadDir, `avatar${av.id}.svg`);
  fs.writeFileSync(filePath, svgContent, 'utf8');
  console.log(`Generated: /uploads/avatar${av.id}.svg`);
});

console.log('Avatar generation completed successfully.');
