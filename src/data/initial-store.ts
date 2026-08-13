import { AboutData, ContactData, Project, SiteSettings } from '../types';

export const initialAboutData: AboutData = {
  name: "SUBEG SINGH",
  title: "Projection Designer & Immersive Media Designer",
  primaryPractice: "Digital Scenography / Projection Design",
  secondaryPractice: "Immersive Media",
  introduction: "Projection Designer & Immersive Media Designer working across digital scenography, live performance, cultural storytelling and immersive experiences.",
  background: "Specializing in the intersection of physical space, light, and real-time canvas architectures. Over a decade of practice directing spatial media systems for opera, theatrical productions, large-scale outdoor installations, and real-time interactive environments.",
  practiceDescription: "Digital Scenography redefines architectural volume through optical illusion, light manipulation, and temporal storytelling. By blending real-time generative computing with spatial choreography, visual narratives expand beyond screens into living architectural canvases.",
  capabilities: [
    "Digital Scenography & Stage Projection",
    "LED Visual Architecture & Content Design",
    "Real-Time Environments (Unreal Engine / TouchDesigner)",
    "Spatial Media & Virtual Production",
    "3D Spatial Motion & Visual Effects",
    "VR / AR Spatial Installations",
    "Interactive Kinetic Light Control",
    "Disguise & Resolume Media Server Systems"
  ],
  cvUrl: "",
  photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
};

export const initialContactData: ContactData = {
  email: "subeg.singh@digitalscenography.com",
  location: "New York / Global",
  additionalLinks: [
    { label: "Representation / Management", url: "mailto:mgmt@digitalscenography.com" },
    { label: "Studio Inquiries", url: "mailto:subeg.singh@digitalscenography.com" }
  ]
};

export const initialSiteSettings: SiteSettings = {
  siteTitle: "SUBEG SINGH — Projection Designer & Immersive Media Designer",
  siteDescription: "Portfolio & Digital Scenography Archive of Subeg Singh",
  contactEmail: "subeg.singh@digitalscenography.com",
  socialLinks: [
    { label: "LinkedIn", url: "https://linkedin.com/in/subegsingh" },
    { label: "Instagram", url: "https://instagram.com/subeg.design" },
    { label: "Vimeo", url: "https://vimeo.com/subegsingh" }
  ],
  adminPasswordInfo: "Configured via environment variable ADMIN_PASSWORD (default: subeg2026)"
};

export const initialProjects: Project[] = [
  {
    id: "proj-1",
    title: "LUMEN: SYMPHONIC MONOLITH",
    slug: "lumen-symphonic-monolith",
    category: "PROJECTION DESIGN",
    year: "2025",
    role: "Lead Projection Designer & Digital Scenographer",
    medium: "Multi-projection architectural mapping on 360° stage facade",
    shortDescription: "A monumental digital scenography commissioned for a contemporary orchestral performance, morphing physical brutalist concrete into fluid light surfaces.",
    longDescription: "LUMEN explores the acoustic resonance of symphonic sound translated into real-time optical physics. Utilizing ten 30,000-lumen laser projectors mapped seamlessly across three kinetic stage surfaces, the installation tracks orchestra dynamics in real-time to deform, illuminate, and dissolve structural boundaries.",
    heroMedia: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1800&q=80",
    hoverMedia: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1800&q=80"
    ],
    videos: [],
    tools: ["TouchDesigner", "Disguise vx4", "Notch", "3D Projection Mapping", "Spatial Audio Integration"],
    credits: [
      { role: "Projection Designer", name: "Subeg Singh" },
      { role: "Symphony Conductor", name: "Elena Rostova" },
      { role: "Technical Director", name: "Marcus Vance" }
    ],
    featured: true,
    published: true,
    sortOrder: 1,
    createdAt: "2025-01-10T10:00:00.000Z",
    updatedAt: "2025-01-10T10:00:00.000Z"
  },
  {
    id: "proj-2",
    title: "CHROMA FACADE: CIVIC LIGHT SCENOGRAPHY",
    slug: "chroma-facade-civic-light",
    category: "PROJECTION DESIGN",
    year: "2024",
    role: "Projection Designer & Visual Director",
    medium: "Large-scale urban facade laser projection",
    shortDescription: "An outdoor digital scenography transforming historical museum masonry into a living canvas celebrating cultural heritage through fluid light waves.",
    longDescription: "CHROMA FACADE reimagines civic public space through non-invasive optical intervention. Projecting across a 120-meter facade, real-time particle physics mimic water flow and architectural crystallization, inviting urban spectators into a shared nocturnal spectacle.",
    heroMedia: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80",
    hoverMedia: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    tools: ["Resolume Arena", "Unreal Engine 5", "Laser Projection Systems", "MadMapper"],
    credits: [
      { role: "Digital Scenographer", name: "Subeg Singh" },
      { role: "Curator", name: "Maya Lin Studio" }
    ],
    featured: true,
    published: true,
    sortOrder: 2,
    createdAt: "2024-11-15T10:00:00.000Z",
    updatedAt: "2024-11-15T10:00:00.000Z"
  },
  {
    id: "proj-3",
    title: "ECHOES OF ETERNITY: SPATIAL OPERA",
    slug: "echoes-of-eternity-spatial-opera",
    category: "PROJECTION DESIGN",
    year: "2024",
    role: "Lead Scenographer & Media Designer",
    medium: "Transparent gauze projection and LED ceiling grid",
    shortDescription: "Layered digital scenography for an experimental avant-garde opera, projecting volumetric holographic forms onto multi-tiered theatrical scrims.",
    longDescription: "Designed for a tri-stage production, 'Echoes of Eternity' blurs the boundary between physical performers and projected mythic entities. Spatial tracking camera rigs synchronized digital projected shadows with live actor choreography.",
    heroMedia: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80",
    hoverMedia: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    tools: ["Disguise d3", "OptiTrack Motion Capture", "Hologram Scrims", "Notch"],
    credits: [
      { role: "Projection Designer", name: "Subeg Singh" },
      { role: "Stage Director", name: "David K. Sterling" }
    ],
    featured: false,
    published: true,
    sortOrder: 3,
    createdAt: "2024-08-20T10:00:00.000Z",
    updatedAt: "2024-08-20T10:00:00.000Z"
  },
  {
    id: "proj-4",
    title: "AETHERIA: REAL-TIME NEURAL VR ARCHITECTURE",
    slug: "aetheria-neural-vr-architecture",
    category: "IMMERSIVE MEDIA",
    year: "2025",
    role: "Immersive Media Designer & Creative Technologist",
    medium: "Interactive VR Installation & Virtual Production Environment",
    shortDescription: "A spatial VR immersion exploring post-physical architecture through real-time procedural point-cloud synthesis and spatial acoustics.",
    longDescription: "AETHERIA invites participants to walk through infinite procedural cathedrals constructed from lidar scans of ancient ruins and real-time neural radiance fields. Participants wear lightweight VR headsets while motion-tracked in a 10m x 10m physical arena mirror-matched in real-time.",
    heroMedia: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1800&q=80",
    hoverMedia: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    tools: ["Unreal Engine 5.4", "Meta Quest Pro", "Lidar Point Clouds", "Spatial Audio HRTF"],
    credits: [
      { role: "Immersive Media Designer", name: "Subeg Singh" },
      { role: "Sound Design", name: "Aria Thorne" }
    ],
    featured: true,
    published: true,
    sortOrder: 4,
    createdAt: "2025-02-01T10:00:00.000Z",
    updatedAt: "2025-02-01T10:00:00.000Z"
  },
  {
    id: "proj-5",
    title: "SYNAPSE: KINETIC LIGHT & VIRTUAL PRODUCTION STAGE",
    slug: "synapse-kinetic-light-virtual-production",
    category: "IMMERSIVE MEDIA",
    year: "2024",
    role: "Virtual Production & Media System Architect",
    medium: "LED Volume & Real-time Motion-tracked Camera System",
    shortDescription: "A virtual production stage combining a curved 270° LED volume with real-time camera tracking for live immersive performance broadcasts.",
    longDescription: "SYNAPSE breaks down the barrier between live broadcast television and immersive spatial worlds. Utilizing a 2.5mm LED volume powered by an array of GPU nodes, real-time parallax reflections and dynamic lighting match physical camera moves instantaneously.",
    heroMedia: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1800&q=80",
    hoverMedia: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80"
    ],
    videos: [],
    tools: ["Unreal Engine LED Volume", "nDisplay", "Mo-Sys StarTracker", "Disguise vx2"],
    credits: [
      { role: "Virtual Production Lead", name: "Subeg Singh" },
      { role: "Cinematographer", name: "Julian Vance" }
    ],
    featured: true,
    published: true,
    sortOrder: 5,
    createdAt: "2024-09-05T10:00:00.000Z",
    updatedAt: "2024-09-05T10:00:00.000Z"
  }
];
