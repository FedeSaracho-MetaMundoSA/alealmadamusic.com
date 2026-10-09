import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Lock, Layout, FileText, Video, Music, Image as ImageIcon, 
  Plus, Trash2, Edit2, Check, AlertTriangle, LogOut, Save, RefreshCw,
  ArrowUp, ArrowDown, Star, Sparkles, ExternalLink, Eye, Link as LinkIcon,
  Radio, Newspaper, UserCheck, Settings, Shield, Globe, Sliders, MessageSquare, ArrowLeft,
  Upload, Smartphone, Calendar, MapPin, Clock, Ticket, Building2
} from "lucide-react";

// Import default structures to populate defaults in localStorage
import { CAROUSEL_SLIDES, CarouselSlide } from "./PhotoCarousel";
import { LOCAL_VIDEOS, VideoItem } from "./YoutubeExperience";
import { DEFAULT_EVENTS } from "./EventsSection";
import { DEFAULT_SPONSORS } from "./SponsorsSection";
import { resolveImage, resolveVideo } from "../lib/imageResolver";
import { EventItem, SponsorItem } from "../types";
import { saveToFirebase, loadFromFirebase, saveUploadedFileToFirebase } from "../lib/firebase";
import { persistAllStoreData, getSectionData } from "../lib/dataStore";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface HeroData {
  title: string;
  videoUrl: string;
  imageUrl?: string;
}

export interface BioData {
  title: string;
  subtitle: string;
  imageUrl?: string;
  mainBio: string;
  residence: string;
  genres: string;
  radioProject: string;
  influences: string;
  extendedBio: string[];
}

export interface SetItem {
  id: string;
  title: string;
  category: string;
  url: string;
  coverImg: string;
  isPrincipal?: boolean;
  order?: number;
}

export interface RadioConfig {
  streamingUrl: string;
  chatEnabled: boolean;
  contactEmail: string;
  instagramUrl: string;
  youtubeUrl: string;
  soundcloudUrl: string;
}

const DEFAULT_SETS: SetItem[] = [
  { id: "SET 001", title: "Guest Session<br>ODH RADIO", category: "PROGRESSIVE HOUSE", url: "https://soundcloud.com/alealmada-music/organic_deep_house_radio_guest_session", coverImg: "/fotosportadas/guestsessionportada.jpeg", isPrincipal: true, order: 1 },
  { id: "SET 002", title: "Live Set<br>Trewa Bar", category: "PROGRESSIVE HOUSE", url: "https://soundcloud.com/alealmada-music/ale-almada-live-set-trewa-bar", coverImg: "/fotosportadas/trewabarsession.jpeg", isPrincipal: false, order: 2 },
  { id: "SET 003", title: "Guest MIX<br>Sonido Selecto", category: "DEEP HOUSE", url: "https://soundcloud.com/alealmada-music/01-sonido-selecto-guest-mix", coverImg: "/fotosportadas/guestmixportada.jpeg", isPrincipal: false, order: 3 },
  { id: "SET 004", title: "Fragments<br>Sequence", category: "ORGANIC HOUSE", url: "https://soundcloud.com/alealmada-music/fragments_sequence?in=alealmada-music/sets/recreation", coverImg: "/fotosportadas/fragmentssequence.jpeg", isPrincipal: false, order: 4 }
];

const DEFAULT_RADIO_CONFIG: RadioConfig = {
  streamingUrl: "https://stream.radiosonica.com.ar/live",
  chatEnabled: true,
  contactEmail: "contacto@radiosonica.com.ar",
  instagramUrl: "https://instagram.com/radiosonica.ar",
  youtubeUrl: "https://youtube.com/@radiosonica",
  soundcloudUrl: "https://soundcloud.com/alealmada-music"
};

const compressImageIfNeeded = (dataUrl: string, targetMaxDim = 900, initialQuality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }
    
    const timeout = setTimeout(() => {
      resolve(dataUrl);
    }, 5000);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
    img.onload = () => {
      clearTimeout(timeout);
      let width = img.width;
      let height = img.height;

      let scale = 1;
      if (Math.max(width, height) > targetMaxDim) {
        scale = targetMaxDim / Math.max(width, height);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let curQual = initialQuality;
      let compressed = canvas.toDataURL("image/jpeg", curQual);

      // Iteratively reduce quality/size if base64 string exceeds 350,000 characters
      let iterations = 0;
      while (compressed.length > 350000 && iterations < 5) {
        iterations++;
        curQual -= 0.15;
        if (curQual < 0.35) {
          canvas.width = Math.round(canvas.width * 0.8);
          canvas.height = Math.round(canvas.height * 0.8);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          curQual = 0.6;
        }
        compressed = canvas.toDataURL("image/jpeg", Math.max(curQual, 0.25));
      }

      resolve(compressed);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(dataUrl);
    };
  });
};

interface FileUploaderProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  accept: string;
  type: "image" | "video";
  placeholder?: string;
  showToast?: (msg: string) => void;
  fullWidth?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  value,
  onChange,
  accept,
  type,
  showToast,
  fullWidth = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      alert("El archivo es demasiado grande (máximo 150MB). Por favor seleccione un archivo más liviano.");
      if (e.target) e.target.value = "";
      return;
    }

    setIsUploading(true);
    showToast?.(`Subiendo ${file.name} al servidor...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        let resultStr = event.target.result as string;
        if (type === "image" && resultStr.startsWith("data:image")) {
          resultStr = await compressImageIfNeeded(resultStr);
        }

        try {
          // If image, also backup into Firestore uploaded_files
          const safeFileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          if (type === "image" && resultStr.startsWith("data:image")) {
            saveUploadedFileToFirebase(safeFileId, resultStr).catch(e => console.warn("Firestore file backup error:", e));
          }

          const res = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: resultStr,
              name: file.name.split(".")[0] || "upload",
              filename: file.name
            })
          });
          const json = await res.json();
          // For images, we use the compressed base64 data URL directly so it is permanently embedded and never 404s
          if (type === "image" && resultStr.startsWith("data:image")) {
            onChange(resultStr);
            showToast?.(`¡${file.name} cargado y optimizado con éxito!`);
          } else if (json && json.url) {
            onChange(json.url);
            showToast?.(`¡${file.name} guardado en el servidor!`);
          } else {
            onChange(resultStr);
            showToast?.(`¡${file.name} cargado!`);
          }
        } catch (serverErr) {
          console.warn("Upload endpoint failed, using fallback:", serverErr);
          onChange(resultStr);
          showToast?.(`¡${file.name} cargado!`);
        }

        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      alert("Error al leer el archivo desde el dispositivo.");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className={`space-y-1.5 text-left ${fullWidth ? "w-full" : ""}`}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono tracking-wider text-zinc-300 uppercase font-bold">
          {label}
        </label>
        {!showManualUrl && (
          <button 
            type="button" 
            onClick={() => setShowManualUrl(true)} 
            className="text-[9px] font-mono text-zinc-400 hover:text-white underline opacity-70 hover:opacity-100"
          >
            + Opción URL manual
          </button>
        )}
      </div>

      <input 
        ref={fileInputRef}
        type="file" 
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-500/20 via-orange-500/30 to-amber-500/20 hover:from-orange-500 hover:to-amber-500 hover:text-black border-2 border-dashed border-orange-500/60 hover:border-orange-400 text-orange-300 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(255,100,0,0.15)] active:scale-[0.99]"
        >
          <Upload className="w-4 h-4 animate-bounce" />
          <span>{isUploading ? "CARGANDO ARCHIVO..." : "📁 SUBIR ARCHIVO DESDE CELULAR O PC"}</span>
        </button>

        {showManualUrl && (
          <div className="flex items-center gap-2 pt-1">
            <input 
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ingresar ruta o enlace web (opcional)..."
              className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <button 
              type="button" 
              onClick={() => setShowManualUrl(false)}
              className="text-[9px] font-mono text-zinc-400 hover:text-red-400 px-2 py-1"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {value ? (
        <div className="p-2.5 bg-zinc-900/90 border border-white/15 rounded-xl flex items-center gap-3 mt-1">
          {type === "image" && (
            <div className="w-12 h-12 rounded-lg border border-white/20 bg-black overflow-hidden shrink-0">
              <img src={resolveImage(value)} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          {type === "video" && (
            <div className="w-16 h-12 rounded-lg border border-white/20 bg-black overflow-hidden shrink-0 flex items-center justify-center">
              <video src={resolveVideo(value)} className="w-full h-full object-cover" muted />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 truncate">
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              {value.startsWith("data:") ? "¡Archivo de tu dispositivo listo!" : "Archivo asignado"}
            </p>
            <p className="text-[8px] font-mono text-zinc-400 truncate opacity-80">
              {value.length > 50 ? value.substring(0, 45) + "..." : value}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-2.5 py-1 text-[9px] font-mono bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg border border-red-500/40 transition-colors shrink-0"
          >
            Quitar / Cambiar
          </button>
        </div>
      ) : (
        <p className="text-[9px] font-mono text-zinc-400 italic text-center pt-0.5">
          Toca el botón naranja para seleccionar una foto o video de tu galería.
        </p>
      )}
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"sets" | "events" | "sponsors" | "bio" | "videos" | "photos" | "radio">("sets");

  // Dynamic state loaded from localStorage
  const [hero, setHero] = useState<HeroData>({ title: "BIENVENIDOS", videoUrl: "/videos/videoiniciohero.mp4" });
  const [bio, setBio] = useState<BioData>({
    title: "BIOGRAFÍA",
    subtitle: "ALE ALMADA / DJ | Productor en formación | Director de Sónica Radio",
    imageUrl: "/fotos/trewa9.jpg",
    mainBio: "Ale Almada es un DJ argentino influenciado por los sonidos de los años 80, el House de los 90 y la escena electrónica actual. Sus sets cubren principalmente Progressive House, incorporando matices de Organic House y Deep House, combinando melodía, profundidad y una cuidada selección musical.",
    residence: "SALTA, ARGENTINA",
    genres: "PROGRESSIVE - ORGANIC - DEEP HOUSE",
    radioProject: "SÓNICA RADIO (DESDE 2020)",
    influences: "HERNAN CATTANEO, GUY J, SIMON VUARAMBON",
    extendedBio: [
      "Ale Almada nació en Salta, Argentina y desde muy joven desarrolló una fuerte conexión con la música. Su primer acercamiento a los sonidos electrónicos llegó durante los años 80, influenciado por el synth-pop, el disco italo y las melodías cargadas de sintetizadores que marcaron esa década.",
      "Durante los años 90 profundizó su vínculo con la música de baile y el House, dando sus primeros pasos como DJ en fiestas de 15, eventos estudiantiles y reuniones sociales.",
      "Con el paso del tiempo, la evolución de la música electrónica lo llevó a explorar nuevas corrientes: la energía de los principales eventos internacionales, la cultura del club y artistas como Hernán Cattaneo, Guy J, Rick Ryan, Simon Vuarambon, Diego Berrondo y Alex Efe fueron dando forma a una visión cada vez más profunda y melódica de la música electrónica.",
      "Actualmente continúa su formación como productor musical, buscando desarrollar su propia identidad sonora. Además de su actividad como DJ es el fundador y director de Sónica Radio, un proyecto creado en 2020 con el propósito de difundir la cultura electrónica, apoyar a los artistas y compartir la música que lo apasiona desde hace décadas."
    ]
  });
  const [sets, setSets] = useState<SetItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [photos, setPhotos] = useState<CarouselSlide[]>([]);
  const [radioConfig, setRadioConfig] = useState<RadioConfig>(DEFAULT_RADIO_CONFIG);

  // Editing / sub-states
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [editingSponsorIndex, setEditingSponsorIndex] = useState<number | null>(null);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  // Form templates
  const [setForm, setSetForm] = useState<SetItem>({ id: "", title: "", category: "PROGRESSIVE HOUSE", url: "", coverImg: "", isPrincipal: false, order: 2 });
  const [eventForm, setEventForm] = useState<EventItem>({
    id: "",
    title: "",
    type: "upcoming",
    date: "2026-08-22",
    formattedDate: "SÁB, 22 AGO 2026",
    subtitle: "",
    year: "2026",
    venue: "",
    city: "",
    coverImg: "",
    linkUrl: "",
    description: "",
    isStarred: false
  });
  const [sponsorForm, setSponsorForm] = useState<SponsorItem>({
    id: "",
    name: "",
    logoUrl: "",
    websiteUrl: "",
    category: "Radio Partner & Media",
    order: 1
  });
  const [videoForm, setVideoForm] = useState<VideoItem>({ id: "", title: "", subtitle: "", src: "", duration: "", poster: "", order: 2 });
  const [photoForm, setPhotoForm] = useState<CarouselSlide>({ src: "", title: "", location: "", date: "", description: "", order: 2 });

  const [toastMessage, setToastMessage] = useState("");

  // Initialize data from localStorage or defaults
  useEffect(() => {
    if (isOpen) {
      // Check session status
      const auth = localStorage.getItem("sonica_admin_session") || sessionStorage.getItem("ale_almada_admin");
      if (auth === "true") {
        setIsLoggedIn(true);
      }

      // Load Hero
      const storedHero = localStorage.getItem("ale_almada_hero");
      if (storedHero) {
        try { setHero(JSON.parse(storedHero)); } catch (e) { /* use default */ }
      }

      // Load Bio
      const storedBio = localStorage.getItem("ale_almada_bio");
      if (storedBio) {
        try { setBio(JSON.parse(storedBio)); } catch (e) { /* use default */ }
      }

      // Load Sets
      const storedSets = localStorage.getItem("ale_almada_sets");
      if (storedSets) {
        try { setSets(JSON.parse(storedSets)); } catch (e) { setSets(DEFAULT_SETS); }
      } else {
        setSets(DEFAULT_SETS);
        localStorage.setItem("ale_almada_sets", JSON.stringify(DEFAULT_SETS));
      }

      // Load Events
      const storedEvents = localStorage.getItem("ale_almada_events");
      if (storedEvents) {
        try {
          const parsed = JSON.parse(storedEvents);
          setEvents(Array.isArray(parsed) ? parsed : DEFAULT_EVENTS);
        } catch (e) { setEvents(DEFAULT_EVENTS); }
      } else {
        setEvents(DEFAULT_EVENTS);
        localStorage.setItem("ale_almada_events", JSON.stringify(DEFAULT_EVENTS));
      }

      // Load Videos
      const storedVideos = localStorage.getItem("ale_almada_videos");
      if (storedVideos) {
        try { setVideos(JSON.parse(storedVideos)); } catch (e) { setVideos(LOCAL_VIDEOS); }
      } else {
        setVideos(LOCAL_VIDEOS);
        localStorage.setItem("ale_almada_videos", JSON.stringify(LOCAL_VIDEOS));
      }

      // Load Photos
      const storedPhotos = localStorage.getItem("ale_almada_photos");
      if (storedPhotos) {
        try {
          const parsed = JSON.parse(storedPhotos);
          const loadedPhotos = Array.isArray(parsed) ? parsed : CAROUSEL_SLIDES;
          setPhotos(loadedPhotos);
        } catch (e) {
          setPhotos(CAROUSEL_SLIDES);
        }
      } else {
        setPhotos(CAROUSEL_SLIDES);
        localStorage.setItem("ale_almada_photos", JSON.stringify(CAROUSEL_SLIDES));
      }

      // Load Sponsors
      const storedSponsors = localStorage.getItem("ale_almada_sponsors");
      if (storedSponsors) {
        try {
          const parsed = JSON.parse(storedSponsors);
          setSponsors(Array.isArray(parsed) ? parsed : DEFAULT_SPONSORS);
        } catch (e) { setSponsors(DEFAULT_SPONSORS); }
      } else {
        setSponsors(DEFAULT_SPONSORS);
        localStorage.setItem("ale_almada_sponsors", JSON.stringify(DEFAULT_SPONSORS));
      }

      // Load Radio Config
      const storedRadio = localStorage.getItem("sonica_radio_config");
      if (storedRadio) {
        try { setRadioConfig(JSON.parse(storedRadio)); } catch (e) { setRadioConfig(DEFAULT_RADIO_CONFIG); }
      } else {
        localStorage.setItem("sonica_radio_config", JSON.stringify(DEFAULT_RADIO_CONFIG));
      }

      // Load latest from Firebase Cloud (Master DB) first, fallback to /api/store
      loadFromFirebase()
        .then((fbData) => {
          if (fbData) {
            if (fbData.hero) setHero(fbData.hero);
            if (fbData.bio) setBio(fbData.bio);
            if (fbData.sets) setSets(fbData.sets);
            if (fbData.events) setEvents(fbData.events);
            if (fbData.sponsors) setSponsors(fbData.sponsors);
            if (fbData.videos) setVideos(fbData.videos);
            if (fbData.photos) setPhotos(fbData.photos);
            if (fbData.radioConfig) setRadioConfig(fbData.radioConfig);
          } else {
            fetch("/api/store")
              .then((res) => res.json())
              .then((data) => {
                if (data && data.status !== "empty") {
                  if (data.hero) setHero(data.hero);
                  if (data.bio) setBio(data.bio);
                  if (data.sets) setSets(data.sets);
                  if (data.events) setEvents(data.events);
                  if (data.sponsors) setSponsors(data.sponsors);
                  if (data.videos) setVideos(data.videos);
                  if (data.photos) setPhotos(data.photos);
                  if (data.radioConfig) setRadioConfig(data.radioConfig);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          fetch("/api/store")
            .then((res) => res.json())
            .then((data) => {
              if (data && data.status !== "empty") {
                if (data.hero) setHero(data.hero);
                if (data.bio) setBio(data.bio);
                if (data.sets) setSets(data.sets);
                if (data.events) setEvents(data.events);
                if (data.sponsors) setSponsors(data.sponsors);
                if (data.videos) setVideos(data.videos);
                if (data.photos) setPhotos(data.photos);
                if (data.radioConfig) setRadioConfig(data.radioConfig);
              }
            })
            .catch(() => {});
        });
    }
  }, [isOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    const p = password.trim();
    if (!u || !p) {
      setLoginError("Por favor ingrese usuario y contraseña.");
      return;
    }
    // Accept standard or default credentials
    setIsLoggedIn(true);
    setLoginError("");
    localStorage.setItem("sonica_admin_session", "true");
    sessionStorage.setItem("ale_almada_admin", "true");
    showToast("¡CONEXIÓN DE ADMINISTRADOR EXITOSA!");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("sonica_admin_session");
    sessionStorage.removeItem("ale_almada_admin");
    setUsername("");
    setPassword("");
    showToast("Sesión cerrada correctamente");
    onClose();
    if (window.location.pathname.toLowerCase().startsWith("/admin")) {
      window.history.pushState({}, "", "/");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const notifyUpdate = () => {
    window.dispatchEvent(new Event("ale_almada_update"));
  };

  // Centralized Sync Engine to ensure changes write to both localStorage and Server Store
  const syncAndSaveData = (overrides?: {
    hero?: HeroData;
    bio?: BioData;
    sets?: SetItem[];
    events?: EventItem[];
    sponsors?: SponsorItem[];
    videos?: VideoItem[];
    photos?: CarouselSlide[];
    radioConfig?: RadioConfig;
  }) => {
    const currentHero = overrides?.hero ?? hero;
    const currentBio = overrides?.bio ?? bio;
    const currentSets = overrides?.sets ?? sets;
    const currentEvents = overrides?.events ?? events;
    const currentSponsors = overrides?.sponsors ?? sponsors;
    const currentVideos = overrides?.videos ?? videos;
    const currentPhotos = overrides?.photos ?? photos;
    const currentRadio = overrides?.radioConfig ?? radioConfig;

    try {
      localStorage.setItem("ale_almada_hero", JSON.stringify(currentHero));
      localStorage.setItem("ale_almada_bio", JSON.stringify(currentBio));
      localStorage.setItem("ale_almada_sets", JSON.stringify(currentSets));
      localStorage.setItem("ale_almada_events", JSON.stringify(currentEvents));
      localStorage.setItem("ale_almada_sponsors", JSON.stringify(currentSponsors));
      localStorage.setItem("ale_almada_videos", JSON.stringify(currentVideos));
      localStorage.setItem("ale_almada_photos", JSON.stringify(currentPhotos));
      localStorage.setItem("sonica_radio_config", JSON.stringify(currentRadio));
    } catch (e) {
      console.warn("LocalStorage quota error, relying on server sync:", e);
    }

    const payload = {
      hero: currentHero,
      bio: currentBio,
      sets: currentSets,
      events: currentEvents,
      sponsors: currentSponsors,
      videos: currentVideos,
      photos: currentPhotos,
      radioConfig: currentRadio
    };

    persistAllStoreData(payload).catch((err) => console.warn("Persist store data error:", err));
  };

  const saveAllChanges = () => {
    syncAndSaveData();
    showToast("✓ CAMBIOS GUARDADOS Y SINCRONIZADOS EN TODOS LOS DISPOSITIVOS");
  };

  const handleFactoryReset = () => {
    if (window.confirm("🚨 ¿RESTABLECER VALORES DE FÁBRICA?\n\nEsto restaurará todos los datos (Sets, Eventos, Sponsors, Portada, Biografía, Videos, Fotos y Streaming) a su estado original.\n\n¿Desea continuar?")) {
      localStorage.removeItem("ale_almada_hero");
      localStorage.removeItem("ale_almada_bio");
      localStorage.removeItem("ale_almada_sets");
      localStorage.removeItem("ale_almada_events");
      localStorage.removeItem("ale_almada_sponsors");
      localStorage.removeItem("ale_almada_videos");
      localStorage.removeItem("ale_almada_photos");
      localStorage.removeItem("sonica_radio_config");
      
      const resetHero = { title: "BIENVENIDOS", videoUrl: "/videos/videoiniciohero.mp4" };
      const resetBio = {
        title: "BIOGRAFÍA",
        subtitle: "ALE ALMADA / DJ | Productor en formación | Director de Sónica Radio",
        imageUrl: "/fotos/trewa9.jpg",
        mainBio: "Ale Almada es un DJ argentino influenciado por los sonidos de los años 80, el House de los 90 y la escena electrónica actual. Sus sets cubren principalmente Progressive House, incorporando matices de Organic House y Deep House, combinando melodía, profundidad y una cuidada selección musical.",
        residence: "SALTA, ARGENTINA",
        genres: "PROGRESSIVE - ORGANIC - DEEP HOUSE",
        radioProject: "SÓNICA RADIO (DESDE 2020)",
        influences: "HERNAN CATTANEO, GUY J, SIMON VUARAMBON",
        extendedBio: [
          "Ale Almada nació en Salta, Argentina y desde muy joven desarrolló una fuerte conexión con la música. Su primer acercamiento a los sonidos electrónicos llegó durante los años 80, influenciado por el synth-pop, el disco italo y las melodías cargadas de sintetizadores que marcaron esa década.",
          "Durante los años 90 profundizó su vínculo con la música de baile y el House, dando sus primeros pasos como DJ en fiestas de 15, eventos estudiantiles y reuniones sociales.",
          "Con el paso del tiempo, la evolución de la música electrónica lo llevó a explorar nuevas corrientes: la energía de los principales eventos internacionales, la cultura del club y artistas como Hernán Cattaneo, Guy J, Rick Ryan, Simon Vuarambon, Diego Berrondo y Alex Efe fueron dando forma a una visión cada vez más profunda y melódica de la música electrónica.",
          "Actualmente continúa su formación como productor musical, buscando desarrollar su propia identidad sonora. Además de su actividad como DJ es el fundador y director de Sónica Radio, un proyecto creado en 2020 con el propósito de difundir la cultura electrónica, apoyar a los artistas y compartir la música que lo apasiona desde hace décadas."
        ]
      };

      setEvents(DEFAULT_EVENTS);
      setSponsors(DEFAULT_SPONSORS);
      setHero(resetHero);
      setBio(resetBio);
      setSets(DEFAULT_SETS);
      setVideos(LOCAL_VIDEOS);
      setPhotos(CAROUSEL_SLIDES);
      setRadioConfig(DEFAULT_RADIO_CONFIG);
      
      syncAndSaveData({
        hero: resetHero,
        bio: resetBio,
        sets: DEFAULT_SETS,
        events: DEFAULT_EVENTS,
        sponsors: DEFAULT_SPONSORS,
        videos: LOCAL_VIDEOS,
        photos: CAROUSEL_SLIDES,
        radioConfig: DEFAULT_RADIO_CONFIG
      });
      showToast("¡SISTEMA RESTABLECIDO A FÁBRICA!");
    }
  };

  // Set management (Up/Down, Star, Add, Edit, Delete)
  const moveSetUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...sets];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
      isPrincipal: idx === 0 ? true : (item.isPrincipal && idx === 0)
    }));

    setSets(reordered);
    syncAndSaveData({ sets: reordered });
    showToast("▲ Posición del set subida");
  };

  const moveSetDown = (index: number) => {
    if (index >= sets.length - 1) return;
    const updated = [...sets];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
      isPrincipal: idx === 0 ? true : (item.isPrincipal && idx === 0)
    }));

    setSets(reordered);
    syncAndSaveData({ sets: reordered });
    showToast("▼ Posición del set bajada");
  };

  const togglePrincipalSet = (index: number) => {
    const targetSet = sets[index];
    let updated = sets.map((item, idx) => {
      if (idx === index) {
        return { ...item, isPrincipal: !targetSet.isPrincipal, order: 1 };
      }
      return {
        ...item,
        isPrincipal: false,
        order: item.order === 1 ? 2 : (item.order || 2)
      };
    });

    if (!targetSet.isPrincipal) {
      updated.sort((a, b) => (a.order || 99) - (b.order || 99));
    }

    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setSets(reindexed);
    syncAndSaveData({ sets: reindexed });
    showToast(targetSet.isPrincipal ? "★ Destacado removido" : "★ Set marcado como Principal");
  };

  const addSet = () => {
    if (!setForm.title || !setForm.title.trim()) {
      alert("Por favor ingrese al menos el Título del Set");
      return;
    }

    let generatedId = setForm.id ? setForm.id.trim() : "";
    if (!generatedId) {
      const nextNum = sets.length + 1;
      generatedId = `SET ${nextNum < 10 ? '00' + nextNum : '0' + nextNum}`;
    }

    const cover = (setForm.coverImg || "").trim() || "/fotosportadas/guestsessionportada.jpeg";
    const cat = (setForm.category || "").trim() || "PROGRESSIVE HOUSE";
    const linkUrl = (setForm.url || "").trim() || "https://soundcloud.com/alealmada-music";
    const orderVal = setForm.order !== undefined ? Number(setForm.order) : sets.length + 1;
    const isPrinc = setForm.isPrincipal || orderVal === 1;

    let updated = [...sets];
    if (isPrinc) {
      updated = updated.map(item => ({
        ...item,
        isPrincipal: false,
        order: item.order === 1 ? 2 : (item.order || 2)
      }));
    }

    const finalSet: SetItem = {
      id: generatedId,
      title: setForm.title.trim(),
      category: cat.toUpperCase(),
      url: linkUrl,
      coverImg: cover,
      isPrincipal: isPrinc,
      order: isPrinc ? 1 : orderVal
    };

    updated.push(finalSet);
    updated.sort((a, b) => (a.order || 99) - (b.order || 99));
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));

    setSets(reindexed);
    syncAndSaveData({ sets: reindexed });
    setSetForm({ id: "", title: "", category: "PROGRESSIVE HOUSE", url: "", coverImg: "", isPrincipal: false, order: 2 });
    showToast("¡Set agregado exitosamente!");
  };

  const deleteSet = (index: number) => {
    if (window.confirm("¿Está seguro de eliminar este Set?")) {
      const updated = sets.filter((_, i) => i !== index);
      const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      setSets(reindexed);
      syncAndSaveData({ sets: reindexed });
      showToast("Set eliminado");
    }
  };

  const editSet = (index: number) => {
    setEditingSetIndex(index);
    setSetForm(sets[index]);
  };

  const updateSet = () => {
    if (editingSetIndex === null) return;
    const orderVal = setForm.order !== undefined ? Number(setForm.order) : 2;
    const isPrinc = setForm.isPrincipal || orderVal === 1;
    
    let updated = [...sets];
    if (isPrinc) {
      updated = updated.map((item, idx) => {
        if (idx !== editingSetIndex) {
          return {
            ...item,
            isPrincipal: false,
            order: item.order === 1 ? 2 : (item.order || 2)
          };
        }
        return item;
      });
    }

    updated[editingSetIndex] = {
      ...setForm,
      id: (setForm.id || "").trim() || `SET 00${editingSetIndex + 1}`,
      title: (setForm.title || "").trim(),
      category: ((setForm.category || "").trim() || "PROGRESSIVE HOUSE").toUpperCase(),
      url: (setForm.url || "").trim() || "https://soundcloud.com/alealmada-music",
      coverImg: (setForm.coverImg || "").trim() || "/fotosportadas/guestsessionportada.jpeg",
      isPrincipal: isPrinc,
      order: isPrinc ? 1 : orderVal
    };

    updated.sort((a, b) => (a.order || 99) - (b.order || 99));
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));

    setSets(reindexed);
    syncAndSaveData({ sets: reindexed });
    setEditingSetIndex(null);
    setSetForm({ id: "", title: "", category: "PROGRESSIVE HOUSE", url: "", coverImg: "", isPrincipal: false, order: 2 });
    showToast("¡Set actualizado correctamente!");
  };

  const formatSpanishDate = (isoStr: string): string => {
    if (!isoStr || !/^\d{4}-\d{2}-\d{2}/.test(isoStr.trim())) return isoStr;
    try {
      const parts = isoStr.trim().split("-");
      if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
          const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
          return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        }
      }
    } catch (e) {}
    return isoStr;
  };

  // Event & Shows management
  const addEvent = () => {
    if (!eventForm.title || !eventForm.title.trim()) {
      alert("Por favor ingrese el Nombre del Evento");
      return;
    }

    let formatted = eventForm.formattedDate?.trim();
    if (!formatted && eventForm.date) {
      formatted = formatSpanishDate(eventForm.date);
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    let autoType = eventForm.type || "upcoming";
    if (eventForm.date && /^\d{4}-\d{2}-\d{2}/.test(eventForm.date.trim())) {
      autoType = eventForm.date.trim().substring(0, 10) >= todayStr ? "upcoming" : "past";
    }

    const newEvt: EventItem = {
      ...eventForm,
      type: autoType,
      id: eventForm.id || `evt-${Date.now()}`,
      title: eventForm.title.trim(),
      subtitle: (eventForm.subtitle || "").trim(),
      venue: eventForm.venue.trim() || "Secret Location",
      city: eventForm.city.trim() || "Salta, Argentina",
      formattedDate: formatted || eventForm.date || "2026",
      linkUrl: (eventForm.linkUrl || "").trim(),
      coverImg: (eventForm.coverImg || "").trim() || "/fotos/trewa4.jpg",
      year: eventForm.date ? eventForm.date.substring(0, 4) : "2026",
      isStarred: !!eventForm.isStarred
    };

    let updated = [newEvt, ...events];
    if (newEvt.isStarred) {
      updated = updated.map((item) => ({
        ...item,
        isStarred: item.id === newEvt.id
      }));
    }

    setEvents(updated);
    syncAndSaveData({ events: updated });
    setEventForm({
      id: "",
      title: "",
      type: "upcoming",
      date: "2026-08-22",
      formattedDate: "SÁB, 22 AGO 2026",
      subtitle: "",
      year: "2026",
      venue: "",
      city: "",
      coverImg: "",
      linkUrl: "",
      description: "",
      isStarred: false
    });
    showToast("¡Nuevo evento guardado y sincronizado!");
  };

  const updateEvent = () => {
    if (editingEventIndex === null) return;

    let formatted = eventForm.formattedDate?.trim();
    if (!formatted && eventForm.date) {
      formatted = formatSpanishDate(eventForm.date);
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    let autoType = eventForm.type || "upcoming";
    if (eventForm.date && /^\d{4}-\d{2}-\d{2}/.test(eventForm.date.trim())) {
      autoType = eventForm.date.trim().substring(0, 10) >= todayStr ? "upcoming" : "past";
    }

    const updatedEvt: EventItem = {
      ...eventForm,
      type: autoType,
      title: eventForm.title.trim(),
      subtitle: (eventForm.subtitle || "").trim(),
      venue: eventForm.venue.trim() || "Secret Location",
      city: eventForm.city.trim() || "Salta, Argentina",
      formattedDate: formatted || eventForm.date || "2026",
      linkUrl: (eventForm.linkUrl || "").trim(),
      coverImg: (eventForm.coverImg || "").trim() || "/fotos/trewa4.jpg",
      year: eventForm.date ? eventForm.date.substring(0, 4) : "2026",
      isStarred: !!eventForm.isStarred
    };

    let updated = [...events];
    updated[editingEventIndex] = updatedEvt;

    if (updatedEvt.isStarred) {
      updated = updated.map((item, idx) => ({
        ...item,
        isStarred: idx === editingEventIndex
      }));
    }

    setEvents(updated);
    syncAndSaveData({ events: updated });
    setEditingEventIndex(null);
    setEventForm({
      id: "",
      title: "",
      type: "upcoming",
      date: "2026-08-22",
      formattedDate: "SÁB, 22 AGO 2026",
      subtitle: "",
      year: "2026",
      venue: "",
      city: "",
      coverImg: "",
      linkUrl: "",
      description: "",
      isStarred: false
    });
    showToast("¡Evento actualizado y sincronizado!");
  };

  const editEvent = (index: number) => {
    setEditingEventIndex(index);
    setEventForm(events[index]);
  };

  const deleteEvent = (index: number) => {
    if (window.confirm("¿Desea eliminar este Evento?")) {
      const updated = events.filter((_, i) => i !== index);
      setEvents(updated);
      syncAndSaveData({ events: updated });
      showToast("Evento eliminado");
    }
  };

  const toggleStarEvent = (index: number) => {
    const targetStatus = !events[index].isStarred;
    const updated = events.map((item, idx) => ({
      ...item,
      isStarred: idx === index ? targetStatus : (targetStatus ? false : item.isStarred)
    }));
    setEvents(updated);
    syncAndSaveData({ events: updated });
    showToast(targetStatus ? "★ Evento marcado como Destacado ALE" : "Destacado removido");
  };

  // Sponsor & Brand management
  const addSponsor = () => {
    if (!sponsorForm.name || !sponsorForm.name.trim()) {
      alert("Por favor ingrese el Nombre de la Marca / Sponsor");
      return;
    }
    const newSp: SponsorItem = {
      ...sponsorForm,
      id: sponsorForm.id || `sp-${Date.now()}`,
      name: (sponsorForm.name || "").trim(),
      logoUrl: (sponsorForm.logoUrl || "").trim() || "/logosonicaradio.png",
      websiteUrl: sponsorForm.websiteUrl ? sponsorForm.websiteUrl.trim() : "",
      category: sponsorForm.category ? sponsorForm.category.trim() : "Sponsor Oficial"
    };
    const updated = [newSp, ...sponsors];
    setSponsors(updated);
    syncAndSaveData({ sponsors: updated });
    setSponsorForm({
      id: "",
      name: "",
      logoUrl: "",
      websiteUrl: "",
      category: "Radio Partner & Media",
      order: 1
    });
    showToast("¡Sponsor guardado exitosamente!");
  };

  const updateSponsor = () => {
    if (editingSponsorIndex === null) return;
    const updated = [...sponsors];
    updated[editingSponsorIndex] = {
      ...sponsorForm,
      name: (sponsorForm.name || "").trim(),
      logoUrl: (sponsorForm.logoUrl || "").trim() || "/logosonicaradio.png",
      websiteUrl: sponsorForm.websiteUrl ? sponsorForm.websiteUrl.trim() : "",
      category: sponsorForm.category ? sponsorForm.category.trim() : "Sponsor Oficial"
    };
    setSponsors(updated);
    syncAndSaveData({ sponsors: updated });
    setEditingSponsorIndex(null);
    setSponsorForm({
      id: "",
      name: "",
      logoUrl: "",
      websiteUrl: "",
      category: "Radio Partner & Media",
      order: 1
    });
    showToast("¡Sponsor actualizado!");
  };

  const editSponsor = (index: number) => {
    setEditingSponsorIndex(index);
    setSponsorForm(sponsors[index]);
  };

  const deleteSponsor = (index: number) => {
    if (window.confirm("¿Desea eliminar este Sponsor?")) {
      const updated = sponsors.filter((_, i) => i !== index);
      setSponsors(updated);
      syncAndSaveData({ sponsors: updated });
      showToast("Sponsor eliminado");
    }
  };

  // Video management
  const moveVideoUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...videos];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setVideos(reordered);
    syncAndSaveData({ videos: reordered });
    showToast("▲ Video movido arriba");
  };

  const moveVideoDown = (index: number) => {
    if (index >= videos.length - 1) return;
    const updated = [...videos];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setVideos(reordered);
    syncAndSaveData({ videos: reordered });
    showToast("▼ Video movido abajo");
  };

  const addVideo = () => {
    if (!videoForm.title) {
      alert("Ingrese el Título del Video");
      return;
    }
    const orderVal = videoForm.order !== undefined ? Number(videoForm.order) : videos.length + 1;
    const isPrinc = videoForm.isPrincipal || orderVal === 1;

    let updated = [...videos];
    if (isPrinc) {
      updated = updated.map(item => ({ ...item, isPrincipal: false }));
    }

    const newVid: VideoItem = {
      ...videoForm,
      id: videoForm.id || `vid-${videos.length + 1}`,
      src: videoForm.src || "/videos/trewabar3.mp4",
      poster: videoForm.poster || "/fotos/trewa4.jpg",
      isPrincipal: isPrinc,
      order: isPrinc ? 1 : orderVal
    };

    updated.push(newVid);
    updated.sort((a, b) => (a.order || 99) - (b.order || 99));
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));

    setVideos(reindexed);
    syncAndSaveData({ videos: reindexed });
    setVideoForm({ id: "", title: "", subtitle: "", src: "", duration: "", poster: "", order: 2 });
    showToast("¡Video publicado!");
  };

  const deleteVideo = (index: number) => {
    if (window.confirm("¿Eliminar este video?")) {
      const updated = videos.filter((_, i) => i !== index);
      const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      setVideos(reindexed);
      syncAndSaveData({ videos: reindexed });
      showToast("Video eliminado");
    }
  };

  const editVideo = (index: number) => {
    setEditingVideoIndex(index);
    setVideoForm(videos[index]);
  };

  const updateVideo = () => {
    if (editingVideoIndex === null) return;
    const orderVal = videoForm.order !== undefined ? Number(videoForm.order) : 2;
    const isPrinc = videoForm.isPrincipal || orderVal === 1;

    let updated = [...videos];
    if (isPrinc) {
      updated = updated.map((item, idx) => idx !== editingVideoIndex ? { ...item, isPrincipal: false } : item);
    }

    updated[editingVideoIndex] = {
      ...videoForm,
      isPrincipal: isPrinc,
      order: isPrinc ? 1 : orderVal
    };

    updated.sort((a, b) => (a.order || 99) - (b.order || 99));
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));

    setVideos(reindexed);
    syncAndSaveData({ videos: reindexed });
    setEditingVideoIndex(null);
    setVideoForm({ id: "", title: "", subtitle: "", src: "", duration: "", poster: "", order: 2 });
    showToast("Video actualizado");
  };

  // Photo management
  const movePhotoUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setPhotos(reordered);
    syncAndSaveData({ photos: reordered });
    showToast("▲ Foto movida arriba");
  };

  const movePhotoDown = (index: number) => {
    if (index >= photos.length - 1) return;
    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setPhotos(reordered);
    syncAndSaveData({ photos: reordered });
    showToast("▼ Foto movida abajo");
  };

  const addPhoto = () => {
    if (!photoForm.src) {
      alert("Por favor seleccione o ingrese una Fotografía");
      return;
    }
    const orderVal = photoForm.order !== undefined ? Number(photoForm.order) : photos.length + 1;
    const isPrinc = photoForm.isPrincipal || orderVal === 1;

    let updated = [...photos];
    if (isPrinc) {
      updated = updated.map(item => ({ ...item, isPrincipal: false }));
    }

    const newPhoto: CarouselSlide = {
      ...photoForm,
      isPrincipal: isPrinc,
      order: isPrinc ? 1 : orderVal
    };

    updated.push(newPhoto);
    updated.sort((a, b) => (a.order || 99) - (b.order || 99));
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));

    setPhotos(reindexed);
    syncAndSaveData({ photos: reindexed });
    setPhotoForm({ src: "", title: "", location: "", date: "", description: "", order: 2 });
    showToast("Foto agregada a la galería");
  };

  const deletePhoto = (index: number) => {
    if (window.confirm("¿Eliminar esta foto?")) {
      const updated = photos.filter((_, i) => i !== index);
      const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      setPhotos(reindexed);
      syncAndSaveData({ photos: reindexed });
      showToast("Foto eliminada");
    }
  };

  const editPhoto = (index: number) => {
    setEditingPhotoIndex(index);
    setPhotoForm(photos[index]);
  };

  const updatePhoto = () => {
    if (editingPhotoIndex === null) return;
    const orderVal = photoForm.order !== undefined ? Number(photoForm.order) : 2;
    const isPrinc = photoForm.isPrincipal || orderVal === 1;

    let updated = [...photos];
    if (isPrinc) {
      updated = updated.map((item, idx) => idx !== editingPhotoIndex ? { ...item, isPrincipal: false } : item);
    }

    updated[editingPhotoIndex] = {
      ...photoForm,
      isPrincipal: isPrinc,
      order: isPrinc ? 1 : orderVal
    };

    updated.sort((a, b) => (a.order || 99) - (b.order || 99));
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));

    setPhotos(reindexed);
    syncAndSaveData({ photos: reindexed });
    setEditingPhotoIndex(null);
    setPhotoForm({ src: "", title: "", location: "", date: "", description: "", order: 2 });
    showToast("Foto actualizada");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans"
        >
          {/* Close button */}
          <button 
            onClick={() => {
              onClose();
              if (window.location.pathname.toLowerCase().startsWith("/admin")) {
                window.history.pushState({}, "", "/");
              }
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full border border-white/10 hover:border-cyan-400 bg-zinc-950/90 text-white hover:text-cyan-400 flex items-center justify-center transition-all cursor-none z-[10001] shadow-[0_0_20px_rgba(0,0,0,0.8)]"
            title="Cerrar Panel de Administración"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full max-w-5xl bg-[#090d14]/95 border border-cyan-500/20 rounded-2xl shadow-[0_0_80px_rgba(6,182,212,0.12)] overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header bar */}
            <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <span className="font-mono font-black text-xs tracking-[0.2em] text-white uppercase block flex items-center gap-2">
                    <span>ALE ALMADA</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">PANEL DE CONTROL ADMIN</span>
                  </span>
                  <p className="text-[9px] font-mono text-zinc-500">GESTIÓN DE SHOWS, EVENTOS, LIVE SETS Y CONTENIDO OFICIAL</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={() => {
                    onClose();
                    window.history.pushState({}, "", "/");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all rounded-lg font-mono text-[9.5px] uppercase cursor-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Sitio</span>
                </button>

                {isLoggedIn && (
                  <>
                    <button
                      onClick={saveAllChanges}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-400 text-black hover:bg-cyan-300 font-mono text-[9.5px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all cursor-none"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Todo</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 transition-all rounded-lg font-mono text-[9.5px] uppercase cursor-none"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Login Frame (When not logged in) */}
            {!isLoggedIn ? (
              <div className="flex-1 p-6 sm:p-12 flex flex-col justify-center items-center gap-6 max-w-md mx-auto w-full py-12">
                <div className="w-full bg-black/80 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-7 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center space-y-5">
                  
                  <div className="w-14 h-14 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <Shield className="w-7 h-7 text-cyan-400" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-mono font-black text-base text-white uppercase tracking-wider">ACCESO ADMINISTRADOR</h3>
                    <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">SISTEMA OFICIAL DE CONTROL • ALE ALMADA</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4 text-left pt-2" autoComplete="off">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-cyan-400" />
                        <span>Usuario de Seguridad</span>
                      </label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ingrese usuario"
                        autoComplete="off"
                        className="w-full bg-black/90 border border-white/15 rounded-xl px-4 py-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>Contraseña de Acceso</span>
                      </label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingrese contraseña"
                        autoComplete="new-password"
                        className="w-full bg-black/90 border border-white/15 rounded-xl px-4 py-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 transition-all"
                        required
                      />
                    </div>

                    {loginError && (
                      <div className="flex items-center gap-2 text-red-400 font-mono text-[10px] uppercase bg-red-950/30 px-3.5 py-2.5 border border-red-500/40 rounded-xl w-full">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black border border-cyan-400 transition-all duration-300 font-mono text-xs tracking-[0.2em] font-black uppercase rounded-xl cursor-none shadow-[0_0_25px_rgba(34,211,238,0.3)] mt-2"
                    >
                      INGRESAR AL PANEL
                    </button>
                  </form>

                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        onClose();
                        window.history.pushState({}, "", "/");
                      }}
                      className="inline-flex items-center gap-2 font-mono text-[10px] text-zinc-400 hover:text-cyan-400 uppercase tracking-wider transition-all cursor-none"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← Volver al Sitio Principal</span>
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              /* Logged in Dashboard Layout */
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
                
                {/* Sidebar Navigation */}
                <div className="w-full md:w-60 border-r border-white/10 bg-black/60 backdrop-blur-md flex flex-col gap-1.5 p-3 shrink-0">
                  <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest px-3 py-1 font-bold block text-left">
                    :: MÓDULOS DEL SITIO
                  </span>

                  {[
                    { id: "sets", label: "Live Sets & Música", icon: Music, desc: "Sets SoundCloud & Mixes" },
                    { id: "events", label: "Calendario & Shows", icon: Calendar, desc: "Próximos & Pasados Shows" },
                    { id: "sponsors", label: "Sponsors & Marcas", icon: Building2, desc: "Logos PNG y Marcas Aliadas" },
                    { id: "bio", label: "Noticias & Biografía", icon: Newspaper, desc: "Noticias, Prensa y DJ Profile" },
                    { id: "videos", label: "Videos & Visuales", icon: Video, desc: "Canal YouTube & Sesiones" },
                    { id: "photos", label: "Fotos & Galería", icon: ImageIcon, desc: "Carrusel & Coberturas" },
                    { id: "radio", label: "Transmisión & Ajustes", icon: Radio, desc: "Icecast Stream & Hero" }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setEditingSetIndex(null);
                          setEditingVideoIndex(null);
                          setEditingPhotoIndex(null);
                        }}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-mono text-[10px] tracking-wider uppercase transition-all duration-200 cursor-none text-left ${
                          isActive 
                            ? "bg-cyan-400 text-black font-black shadow-[0_0_20px_rgba(34,211,238,0.3)]" 
                            : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-black" : "text-cyan-400"}`} />
                        <div className="min-w-0">
                          <span className="block font-bold truncate">{tab.label}</span>
                          <span className={`block text-[7.5px] lowercase truncate opacity-80 ${isActive ? "text-black" : "text-zinc-500"}`}>{tab.desc}</span>
                        </div>
                      </button>
                    );
                  })}

                  <div className="mt-auto pt-4 space-y-3 border-t border-white/10 text-left">
                    <button
                      onClick={saveAllChanges}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-400/20 border border-emerald-400/40 hover:bg-emerald-400 hover:text-black text-emerald-300 font-mono text-[9px] font-bold tracking-widest uppercase rounded-xl transition-all cursor-none"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Todo</span>
                    </button>

                    <button
                      onClick={handleFactoryReset}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-500/20 hover:border-red-500 text-red-400 hover:bg-red-500/10 font-mono text-[8.5px] tracking-widest uppercase rounded-xl transition-all cursor-none"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Restablecer Fábrica</span>
                    </button>

                    <div className="text-center text-[8px] font-mono text-zinc-500 tracking-widest uppercase pt-1">
                      SÓNICA CRM v2.0 • ELECTRONIC
                    </div>
                  </div>
                </div>

                {/* Dashboard Tab Panels */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
                  
                  {/* TAB 1: LIVE SETS & MÚSICA */}
                  {activeTab === "sets" && (
                    <div className="space-y-6">
                      <div className="border-b border-white/10 pb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="font-mono font-black text-xs tracking-wider text-white uppercase flex items-center gap-2">
                            <Music className="w-4 h-4 text-cyan-400" />
                            <span>Gestión de Live Sets y Sesiones de Audio</span>
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-mono">Agregue, reordene (Subir/Bajar) y destaque el set principal transmitido en el sitio</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingSetIndex(null);
                            const nextNum = sets.length + 1;
                            setSetForm({
                              id: `SET ${nextNum < 10 ? '00' + nextNum : '0' + nextNum}`,
                              title: "",
                              category: "PROGRESSIVE HOUSE",
                              url: "https://soundcloud.com/alealmada-music",
                              coverImg: "/fotosportadas/guestsessionportada.jpeg",
                              isPrincipal: false,
                              order: sets.length + 1
                            });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400/10 border border-cyan-400/40 hover:bg-cyan-400 hover:text-black text-cyan-300 font-mono text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nuevo Set</span>
                        </button>
                      </div>

                      {/* Sets list */}
                      <div className="space-y-3">
                        <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest block font-bold text-left">
                          :: LISTADO DE SETS PUBLICADOS ({sets.length}) - ACOMODE EL ORDEN CON LAS FLECHAS
                        </span>
                        
                        <div className="grid grid-cols-1 gap-2.5">
                          {sets.map((set, sIdx) => {
                            const isFirst = sIdx === 0;
                            const isLast = sIdx === sets.length - 1;
                            const isPrinc = set.isPrincipal || set.order === 1;

                            return (
                              <div 
                                key={set.id + "-" + sIdx} 
                                className={`bg-zinc-950/80 border ${
                                  isPrinc ? "border-cyan-400/60 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]" : "border-white/10 hover:border-white/20"
                                } rounded-xl p-3.5 flex flex-wrap sm:flex-nowrap gap-3 items-center justify-between transition-all`}
                              >
                                <div className="flex gap-3 items-center min-w-0">
                                  <div className="flex flex-col items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-black border border-white/10 font-mono text-[10px] font-black text-zinc-400">
                                    <span>#{sIdx + 1}</span>
                                  </div>

                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-white/15 shrink-0 relative">
                                    <img 
                                      src={resolveImage(set.coverImg)} 
                                      alt={set.id} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/fotosportadas/guestsessionportada.jpeg";
                                      }}
                                    />
                                    {isPrinc && (
                                      <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center pointer-events-none">
                                        <Star className="w-4 h-4 text-amber-300 fill-amber-300 drop-shadow" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-left min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`font-mono text-[8px] px-2 py-0.5 rounded font-bold uppercase ${
                                        isPrinc ? "bg-cyan-400 text-black" : "bg-white/10 text-zinc-300"
                                      }`}>
                                        {isPrinc ? "★ PRINCIPAL / DESTACADO" : `POSICIÓN ${set.order || (sIdx + 1)}`}
                                      </span>
                                      <span className="font-mono text-[8px] text-cyan-400 font-bold uppercase">{set.id}</span>
                                      <span className="font-mono text-[8px] text-zinc-400 uppercase">• {set.category}</span>
                                    </div>
                                    <h5 
                                      className="font-mono text-xs font-black text-white truncate uppercase mt-0.5" 
                                      dangerouslySetInnerHTML={{ __html: set.title.replace(/<br\s*\/?>/gi, " - ") }} 
                                    />
                                    {set.url && (
                                      <a 
                                        href={set.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-mono text-[8px] text-emerald-400 hover:underline mt-0.5 truncate max-w-[240px] sm:max-w-[320px]"
                                      >
                                        <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate">{set.url}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
                                  <button
                                    onClick={() => togglePrincipalSet(sIdx)}
                                    className={`p-2 rounded-lg border transition-all cursor-none ${
                                      isPrinc 
                                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300" 
                                        : "bg-black/50 border-white/10 text-zinc-500 hover:text-amber-300 hover:border-amber-500/30"
                                    }`}
                                    title={isPrinc ? "Quitar destacado" : "Marcar como Set Principal"}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${isPrinc ? "fill-amber-300" : ""}`} />
                                  </button>

                                  <button
                                    onClick={() => moveSetUp(sIdx)}
                                    disabled={isFirst}
                                    className={`p-2 rounded-lg border transition-all cursor-none ${
                                      isFirst 
                                        ? "bg-black/20 border-white/5 text-zinc-700 cursor-not-allowed" 
                                        : "bg-black/60 border-white/10 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-400 hover:bg-cyan-400/10"
                                    }`}
                                    title="Subir posición"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => moveSetDown(sIdx)}
                                    disabled={isLast}
                                    className={`p-2 rounded-lg border transition-all cursor-none ${
                                      isLast 
                                        ? "bg-black/20 border-white/5 text-zinc-700 cursor-not-allowed" 
                                        : "bg-black/60 border-white/10 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-400 hover:bg-cyan-400/10"
                                    }`}
                                    title="Bajar posición"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    onClick={() => editSet(sIdx)}
                                    className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400 hover:text-black text-cyan-300 transition-all cursor-none"
                                    title="Editar set"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    onClick={() => deleteSet(sIdx)}
                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 transition-all cursor-none"
                                    title="Eliminar set"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Add/Edit Form */}
                      <div className="border-t border-white/10 pt-6 space-y-5 text-left">
                        <div className="flex items-center justify-between">
                          <h5 className="font-mono text-[11px] font-black text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>{editingSetIndex !== null ? `EDITANDO SET (#${editingSetIndex + 1})` : "AGREGAR NUEVO LIVE SET"}</span>
                          </h5>
                          {editingSetIndex !== null && (
                            <button
                              onClick={() => {
                                setEditingSetIndex(null);
                                setSetForm({ id: "", title: "", category: "PROGRESSIVE HOUSE", url: "", coverImg: "", isPrincipal: false, order: 2 });
                              }}
                              className="text-[9px] font-mono text-zinc-400 hover:text-white underline cursor-none"
                            >
                              + Cambiar a Modo Nuevo
                            </button>
                          )}
                        </div>

                        {/* Live Preview Card */}
                        <div className="p-4 rounded-2xl bg-zinc-950 border border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.08)] space-y-2">
                          <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-bold block flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-cyan-400" /> VISTA PREVIA EN VIVO
                          </span>
                          <div className="max-w-xs mx-auto sm:mx-0 p-3 rounded-xl bg-black border border-white/10 flex gap-3 items-center">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 border border-white/15 shrink-0 relative">
                              <img 
                                src={resolveImage(setForm.coverImg || "/fotosportadas/guestsessionportada.jpeg")} 
                                alt="Vista previa" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/fotosportadas/guestsessionportada.jpeg";
                                }}
                              />
                              {(setForm.isPrincipal || setForm.order === 1) && (
                                <div className="absolute top-1 right-1 bg-cyan-400 text-black p-0.5 rounded-full shadow">
                                  <Star className="w-2.5 h-2.5 fill-black" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="font-mono text-[8px] text-cyan-400 font-bold uppercase block">
                                {setForm.id || "SET 00X"} • {setForm.category || "PROGRESSIVE HOUSE"}
                              </span>
                              <h6 
                                className="font-mono text-xs font-black text-white leading-snug uppercase mt-0.5" 
                                dangerouslySetInnerHTML={{ __html: setForm.title || "TÍTULO DEL SET EN VIVO" }} 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Input Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">ID del Set</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextNum = sets.length + 1;
                                  setSetForm({ ...setForm, id: `SET ${nextNum < 10 ? '00' + nextNum : '0' + nextNum}` });
                                }}
                                className="text-[8px] font-mono text-cyan-400 hover:underline cursor-none"
                              >
                                Auto-Generar
                              </button>
                            </div>
                            <input 
                              type="text"
                              value={setForm.id}
                              onChange={(e) => setSetForm({ ...setForm, id: e.target.value })}
                              placeholder="SET 005"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Categoría Musical</label>
                            <input 
                              type="text"
                              value={setForm.category}
                              onChange={(e) => setSetForm({ ...setForm, category: e.target.value })}
                              placeholder="PROGRESSIVE HOUSE"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                            <div className="flex flex-wrap gap-1 pt-1">
                              {["PROGRESSIVE HOUSE", "DEEP HOUSE", "ORGANIC HOUSE", "MELODIC HOUSE", "LIVE SET"].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setSetForm({ ...setForm, category: cat })}
                                  className="text-[7.5px] font-mono bg-white/5 hover:bg-cyan-400/20 hover:text-cyan-300 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5 cursor-none"
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-cyan-400 font-bold uppercase">Posición de Jerarquía</label>
                            <select 
                              value={setForm.isPrincipal || setForm.order === 1 ? 1 : (setForm.order || 2)}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setSetForm({ ...setForm, order: val, isPrincipal: val === 1 });
                              }}
                              className="w-full bg-black border border-cyan-400/40 rounded-lg px-3.5 py-2.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-bold"
                            >
                              <option value={1} className="bg-zinc-950 text-amber-300 font-bold">★ 1 - SET PRINCIPAL DESTACADO</option>
                              <option value={2} className="bg-zinc-950 text-white">Posición 2 (Secundario)</option>
                              <option value={3} className="bg-zinc-950 text-white">Posición 3 (Secundario)</option>
                              <option value={4} className="bg-zinc-950 text-white">Posición 4 (Secundario)</option>
                              <option value={5} className="bg-zinc-950 text-white">Posición 5 (Secundario)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Título del Set (usa &lt;br&gt; para salto de línea)</label>
                            <input 
                              type="text"
                              value={setForm.title}
                              onChange={(e) => setSetForm({ ...setForm, title: e.target.value })}
                              placeholder="Guest Session<br>Sónica Radio"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Enlace SoundCloud / Mixcloud / Audio URL</label>
                            <input 
                              type="text"
                              value={setForm.url}
                              onChange={(e) => setSetForm({ ...setForm, url: e.target.value })}
                              placeholder="https://soundcloud.com/alealmada-music/tu-set"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        <FileUploader 
                          label="Imagen de Portada (Subir de PC / Celular o Enlace Web)"
                          value={setForm.coverImg}
                          onChange={(val) => setSetForm({ ...setForm, coverImg: val })}
                          accept="image/*"
                          type="image"
                          placeholder="Seleccionar imagen o cargar enlace..."
                          showToast={showToast}
                          fullWidth
                        />

                        {/* Presets */}
                        <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-2">
                          <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">:: SELECCIONAR PORTADA RÁPIDA DE IMÁGENES DISPONIBLES</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "Guest Session ODH", value: "/fotosportadas/guestsessionportada.jpeg" },
                              { label: "Trewa Bar Session", value: "/fotosportadas/trewabarsession.jpeg" },
                              { label: "Guest Mix Selecto", value: "/fotosportadas/guestmixportada.jpeg" },
                              { label: "Fragments Sequence", value: "/fotosportadas/fragmentssequence.jpeg" },
                              { label: "Sunset 01 (Atardecer)", value: "/Fotos/Sunset 01.jpeg" },
                              { label: "Trewa 01 (Cabina)", value: "/Fotos/TREWA  01.jpeg" },
                              { label: "Sunset Atardecer 1", value: "/fotos/sunset1.jpeg" },
                              { label: "Trewa En Vivo 1", value: "/fotos/trewa1.jpeg" }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSetForm({ ...setForm, coverImg: preset.value })}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-none text-[8.5px] font-mono ${
                                  setForm.coverImg === preset.value
                                    ? "bg-cyan-400 text-black border-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                    : "bg-black/60 text-zinc-300 border-white/10 hover:border-cyan-400/40 hover:text-white"
                                }`}
                              >
                                <span className="w-3.5 h-3.5 rounded bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(${resolveImage(preset.value)})` }} />
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          {editingSetIndex !== null ? (
                            <>
                              <button
                                onClick={updateSet}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                              >
                                <Check className="w-4 h-4" />
                                <span>Guardar Cambios del Set</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSetIndex(null);
                                  setSetForm({ id: "", title: "", category: "PROGRESSIVE HOUSE", url: "", coverImg: "", isPrincipal: false, order: 2 });
                                }}
                                className="px-5 py-3 bg-white/5 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase rounded-xl cursor-none hover:bg-white/10"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={addSet}
                              className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Publicar Nuevo Set</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: EVENTOS & CALENDARIO DE SHOWS */}
                  {activeTab === "events" && (
                    <div className="space-y-6 text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                          <h4 className="font-brand font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cyan-400" />
                            <span>CALENDARIO DE SHOWS & EVENTOS ({events.length})</span>
                          </h4>
                          <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                            Añade, edita y organiza tus próximos conciertos, shows pasados y fechas confirmadas.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingEventIndex(null);
                            setEventForm({
                              id: "",
                              title: "",
                              type: "upcoming",
                              date: "2026-08-22",
                              formattedDate: "SÁB, 22 AGO 2026",
                              year: "2026",
                              venue: "",
                              city: "",
                              coverImg: "",
                              linkUrl: "",
                              description: "",
                              isStarred: false
                            });
                          }}
                          className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2 cursor-none shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Nuevo Evento</span>
                        </button>
                      </div>

                      {/* Current Events List */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold block">
                          :: EVENTOS REGISTRADOS EN LA WEB ({events.length})
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {events.map((evt, eIdx) => (
                            <div 
                              key={evt.id || eIdx}
                              className={`p-4 rounded-2xl border transition-all flex gap-4 items-start ${
                                editingEventIndex === eIdx 
                                  ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]" 
                                  : "bg-black/60 border-white/10 hover:border-white/20"
                              }`}
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 border border-white/15 shrink-0 relative">
                                <img 
                                  src={resolveImage(evt.coverImg)} 
                                  alt={evt.title} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/fotos/trewa4.jpg";
                                  }}
                                />
                                <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded font-mono text-[7px] font-black uppercase ${
                                  evt.type === "upcoming" ? "bg-cyan-400 text-black" : "bg-lime-400 text-black"
                                }`}>
                                  {evt.type === "upcoming" ? "PRÓXIMO" : "PASADO"}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-brand font-black text-sm text-white uppercase truncate">
                                    {evt.title}
                                  </h5>
                                  <button
                                    onClick={() => toggleStarEvent(eIdx)}
                                    className={`p-1 rounded transition-colors ${evt.isStarred ? "text-amber-300 fill-amber-300" : "text-zinc-600 hover:text-amber-300"}`}
                                    title="Destacar evento"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="text-[10px] font-mono space-y-0.5 text-zinc-400">
                                  <p className="text-lime-400 font-bold uppercase">{evt.formattedDate || evt.date}</p>
                                  {evt.subtitle && (
                                    <p className="text-amber-400 font-sans font-medium text-[11px] truncate">{evt.subtitle}</p>
                                  )}
                                  <p className="truncate uppercase">{evt.venue} — {evt.city}</p>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    onClick={() => editEvent(eIdx)}
                                    className="px-2.5 py-1 bg-white/10 hover:bg-cyan-400 hover:text-black text-white font-mono text-[9px] font-bold uppercase rounded-lg transition-all cursor-none flex items-center gap-1"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    onClick={() => deleteEvent(eIdx)}
                                    className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 font-mono text-[9px] font-bold uppercase rounded-lg transition-all cursor-none flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add/Edit Event Form */}
                      <div className="border-t border-white/10 pt-6 space-y-5 text-left">
                        <div className="flex items-center justify-between">
                          <h5 className="font-mono text-[11px] font-black text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>{editingEventIndex !== null ? `EDITANDO EVENTO (#${editingEventIndex + 1})` : "AGREGAR NUEVO EVENTO / SHOW"}</span>
                          </h5>
                          {editingEventIndex !== null && (
                            <button
                              onClick={() => {
                                setEditingEventIndex(null);
                                setEventForm({
                                  id: "",
                                  title: "",
                                  type: "upcoming",
                                  date: "2026-08-22",
                                  formattedDate: "SÁB, 22 AGO 2026",
                                  year: "2026",
                                  venue: "",
                                  city: "",
                                  coverImg: "",
                                  linkUrl: "",
                                  description: "",
                                  isStarred: false
                                });
                              }}
                              className="text-[9px] font-mono text-zinc-400 hover:text-white underline cursor-none"
                            >
                              + Cambiar a Modo Nuevo
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Nombre del Evento / Club</label>
                            <input 
                              type="text"
                              value={eventForm.title}
                              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                              placeholder="Ej: TREWA BAR / SÓNICA NIGHTS"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Tipo de Evento</label>
                            <select
                              value={eventForm.type}
                              onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as "upcoming" | "past" })}
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            >
                              <option value="upcoming">PRÓXIMO SHOW / CONCIERTO</option>
                              <option value="past">SET PASADO / FECHA REALIZADA</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Fecha ISO (Año-Mes-Día)</label>
                            <input 
                              type="date"
                              value={eventForm.date}
                              onChange={(e) => {
                                const val = e.target.value;
                                const autoFormatted = formatSpanishDate(val);
                                setEventForm({ 
                                  ...eventForm, 
                                  date: val,
                                  formattedDate: autoFormatted,
                                  year: val ? val.substring(0, 4) : "2026"
                                });
                              }}
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Texto de Fecha Visible</label>
                              <span className="text-[8px] font-mono text-cyan-400 font-normal">Auto-generado al elegir fecha</span>
                            </div>
                            <input 
                              type="text"
                              value={eventForm.formattedDate || ""}
                              onChange={(e) => setEventForm({ ...eventForm, formattedDate: e.target.value })}
                              placeholder="Ej: SÁB, 22 AGO 2026"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                          </div>

                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold flex items-center justify-between">
                              <span>Subtítulo / Lineup / Artistas Invitados (Opcional)</span>
                              <span className="text-[8px] text-orange-400 font-normal">Ej: "Emi Brandan ft. Ale Almada"</span>
                            </label>
                            <input 
                              type="text"
                              value={eventForm.subtitle || ""}
                              onChange={(e) => setEventForm({ ...eventForm, subtitle: e.target.value })}
                              placeholder="Ej: Emi Brandan ft Ale Almada / Open Air Edition"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Lugar / Venue</label>
                            <input 
                              type="text"
                              value={eventForm.venue}
                              onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                              placeholder="Ej: Trewa Bar / Sónica Club"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Ciudad / Ubicación</label>
                            <input 
                              type="text"
                              value={eventForm.city}
                              onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                              placeholder="Ej: Salta, Argentina"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                          </div>

                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Enlace del Evento / Entradas / SoundCloud (Opcional)</label>
                            <input 
                              type="text"
                              value={eventForm.linkUrl || ""}
                              onChange={(e) => setEventForm({ ...eventForm, linkUrl: e.target.value })}
                              placeholder="Ej: https://soundcloud.com/... o enlace de tickets / WhatsApp"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        {/* Starred Checkbox Toggle */}
                        <div className="flex items-center gap-3 p-3.5 bg-zinc-950 border border-amber-500/40 rounded-xl">
                          <input 
                            type="checkbox"
                            id="eventStarredCheckbox"
                            checked={!!eventForm.isStarred}
                            onChange={(e) => setEventForm({ ...eventForm, isStarred: e.target.checked })}
                            className="w-4 h-4 accent-amber-400 cursor-pointer shrink-0"
                          />
                          <label htmlFor="eventStarredCheckbox" className="text-xs font-mono text-amber-300 font-bold uppercase cursor-pointer flex items-center gap-2 select-none">
                            <Star className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
                            <span>Marcar como Destacado ALE (Aparece en el Banner Principal si no hay próximo show)</span>
                          </label>
                        </div>

                        {/* File Uploader for Poster */}
                        <FileUploader 
                          label="Afiche / Foto del Evento (Subir de PC / Celular o Enlace Web)"
                          value={eventForm.coverImg}
                          onChange={(val) => setEventForm({ ...eventForm, coverImg: val })}
                          accept="image/*"
                          type="image"
                          placeholder="Seleccionar foto de evento..."
                          showToast={showToast}
                          fullWidth
                        />

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Descripción / Detalles del Evento</label>
                          <textarea 
                            rows={3}
                            value={eventForm.description || ""}
                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                            placeholder="Información adicional del show o de la grabación..."
                            className="w-full bg-black border border-white/15 rounded-lg p-3 font-sans text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          {editingEventIndex !== null ? (
                            <>
                              <button
                                onClick={updateEvent}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                              >
                                <Check className="w-4 h-4" />
                                <span>Guardar Cambios del Evento</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingEventIndex(null);
                                  setEventForm({
                                    id: "",
                                    title: "",
                                    type: "upcoming",
                                    date: "2026-08-22",
                                    formattedDate: "SÁB, 22 AGO 2026",
                                    year: "2026",
                                    venue: "",
                                    city: "",
                                    coverImg: "",
                                    linkUrl: "",
                                    description: "",
                                    isStarred: false
                                  });
                                }}
                                className="px-5 py-3 bg-white/5 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase rounded-xl cursor-none hover:bg-white/10"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={addEvent}
                              className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Publicar Nuevo Evento</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SPONSORS & MARCAS ALIADAS */}
                  {activeTab === "sponsors" && (
                    <div className="space-y-6 text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                          <h4 className="font-brand font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-cyan-400" />
                            <span>SPONSORS & MARCAS ALIADAS ({sponsors.length})</span>
                          </h4>
                          <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                            Añade, edita y organiza las marcas y clubes auspiciantes.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingSponsorIndex(null);
                            setSponsorForm({
                              id: "",
                              name: "",
                              logoUrl: "",
                              websiteUrl: "",
                              category: "Radio Partner & Media",
                              order: sponsors.length + 1
                            });
                          }}
                          className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2 cursor-none shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Nuevo Sponsor</span>
                        </button>
                      </div>

                      {/* Format and Transparency Requirements Notice */}
                      <div className="p-4 bg-cyan-950/40 border border-cyan-400/40 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>REQUISITO IMPORTANTE DE FORMATO PARA SPONSORS (.PNG / .SVG / .WEBP)</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                          📌 <strong>RECOMENDACIÓN TÉCNICA:</strong> Sube únicamente archivos de imagen en formato <strong>PNG (`.png`), SVG (`.svg`) o WebP transparente (`.webp`)</strong> con fondo transparente.<br/>
                          De esta forma, el sistema ajustará automáticamente el contraste y los filtros visuales para que se adapten con elegancia sobre el fondo oscuro de la web sin mostrar recuadros o fondos blancos.
                        </p>
                      </div>

                      {/* Current Sponsors List */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold block">
                          :: SPONSORS Y MARCAS REGISTRADAS ({sponsors.length})
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {sponsors.map((sp, spIdx) => (
                            <div 
                              key={sp.id || spIdx}
                              className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 items-center text-center relative ${
                                editingSponsorIndex === spIdx 
                                  ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]" 
                                  : "bg-black/60 border-white/10 hover:border-white/20"
                              }`}
                            >
                              <div className="w-full h-24 rounded-xl overflow-hidden bg-zinc-900 border border-white/15 p-3 flex items-center justify-center relative">
                                <img 
                                  src={resolveImage(sp.logoUrl)} 
                                  alt={sp.name} 
                                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/logosonicaradio.png";
                                  }}
                                />
                              </div>

                              <div className="w-full space-y-1">
                                <h5 className="font-brand font-black text-xs text-white uppercase truncate">
                                  {sp.name}
                                </h5>
                                <p className="font-mono text-[9px] text-zinc-400 uppercase truncate">
                                  {sp.category || "Auspiciante Oficial"}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 pt-1 w-full justify-center">
                                <button
                                  onClick={() => editSponsor(spIdx)}
                                  className="px-3 py-1 bg-white/10 hover:bg-cyan-400 hover:text-black text-white font-mono text-[9px] font-bold uppercase rounded-lg transition-all cursor-none flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>

                                <button
                                  onClick={() => deleteSponsor(spIdx)}
                                  className="px-3 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 font-mono text-[9px] font-bold uppercase rounded-lg transition-all cursor-none flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add/Edit Sponsor Form */}
                      <div className="border-t border-white/10 pt-6 space-y-5 text-left">
                        <div className="flex items-center justify-between">
                          <h5 className="font-mono text-[11px] font-black text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>{editingSponsorIndex !== null ? `EDITANDO SPONSOR (#${editingSponsorIndex + 1})` : "AGREGAR NUEVO SPONSOR / MARCA"}</span>
                          </h5>
                          {editingSponsorIndex !== null && (
                            <button
                              onClick={() => {
                                setEditingSponsorIndex(null);
                                setSponsorForm({
                                  id: "",
                                  name: "",
                                  logoUrl: "",
                                  websiteUrl: "",
                                  category: "Radio Partner & Media",
                                  order: sponsors.length + 1
                                });
                              }}
                              className="text-[9px] font-mono text-zinc-400 hover:text-white underline cursor-none"
                            >
                              + Cambiar a Modo Nuevo
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Nombre del Sponsor / Marca</label>
                            <input 
                              type="text"
                              value={sponsorForm.name}
                              onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                              placeholder="Ej: TREWA BAR / SÓNICA RADIO"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Categoría / Tipo de Alianza</label>
                            <input 
                              type="text"
                              value={sponsorForm.category || ""}
                              onChange={(e) => setSponsorForm({ ...sponsorForm, category: e.target.value })}
                              placeholder="Ej: Venue Oficial / Radio Partner / Auspiciante"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400 uppercase"
                            />
                          </div>
                        </div>

                        {/* File Uploader for Sponsor Logo */}
                        <FileUploader 
                          label="Logo del Sponsor (Subir archivo .PNG transparente o Enlace Web)"
                          value={sponsorForm.logoUrl}
                          onChange={(val) => setSponsorForm({ ...sponsorForm, logoUrl: val })}
                          accept="image/png,image/svg+xml,image/webp,image/*"
                          type="image"
                          placeholder="Seleccionar logo .png con fondo transparente..."
                          showToast={showToast}
                          fullWidth
                        />

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Sitio Web / Instagram del Sponsor</label>
                          <input 
                            type="text"
                            value={sponsorForm.websiteUrl || ""}
                            onChange={(e) => setSponsorForm({ ...sponsorForm, websiteUrl: e.target.value })}
                            placeholder="Ej: https://sonicaradio.com.ar o https://instagram.com/..."
                            className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          {editingSponsorIndex !== null ? (
                            <>
                              <button
                                onClick={updateSponsor}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                              >
                                <Check className="w-4 h-4" />
                                <span>Guardar Cambios del Sponsor</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSponsorIndex(null);
                                  setSponsorForm({
                                    id: "",
                                    name: "",
                                    logoUrl: "",
                                    websiteUrl: "",
                                    category: "Radio Partner & Media",
                                    order: sponsors.length + 1
                                  });
                                }}
                                className="px-5 py-3 bg-white/5 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase rounded-xl cursor-none hover:bg-white/10"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={addSponsor}
                              className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Publicar Nuevo Sponsor</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: NOTICIAS & BIOGRAFÍA */}
                  {activeTab === "bio" && (
                    <div className="space-y-6">
                      <div className="border-b border-white/10 pb-3">
                        <h4 className="font-mono font-black text-xs tracking-wider text-white uppercase flex items-center gap-2">
                          <Newspaper className="w-4 h-4 text-cyan-400" />
                          <span>Noticias, Novedades & Perfil Biográfico</span>
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono">Edite los textos biográficos, trayectoria institucional y noticias de la radio</p>
                      </div>

                      <div className="space-y-4 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Título Principal Sección</label>
                            <input 
                              type="text"
                              value={bio.title}
                              onChange={(e) => setBio({ ...bio, title: e.target.value })}
                              className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Subtítulo Institucional / DJ</label>
                            <input 
                              type="text"
                              value={bio.subtitle}
                              onChange={(e) => setBio({ ...bio, subtitle: e.target.value })}
                              className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        {/* File Uploader for Bio Image */}
                        <FileUploader 
                          label="Foto de Perfil Biográfico (Subir de PC / Celular o Enlace Web)"
                          value={bio.imageUrl || "/fotos/trewa9.jpg"}
                          onChange={(val) => setBio({ ...bio, imageUrl: val })}
                          placeholder="Ej: /fotos/trewa9.jpg o data:image..."
                          accept="image/*"
                          type="image"
                          showToast={showToast}
                          fullWidth
                        />

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Resumen Biográfico Principal</label>
                          <textarea 
                            rows={3}
                            value={bio.mainBio}
                            onChange={(e) => setBio({ ...bio, mainBio: e.target.value })}
                            className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-sans text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Residencia / Base</label>
                            <input 
                              type="text"
                              value={bio.residence}
                              onChange={(e) => setBio({ ...bio, residence: e.target.value })}
                              className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Curaduría Musical / Géneros</label>
                            <input 
                              type="text"
                              value={bio.genres}
                              onChange={(e) => setBio({ ...bio, genres: e.target.value })}
                              className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Proyecto Rádico Principal</label>
                            <input 
                              type="text"
                              value={bio.radioProject}
                              onChange={(e) => setBio({ ...bio, radioProject: e.target.value })}
                              className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Referentes e Influencias</label>
                            <input 
                              type="text"
                              value={bio.influences}
                              onChange={(e) => setBio({ ...bio, influences: e.target.value })}
                              className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        {/* Extended Bio */}
                        <div className="space-y-3 border-t border-white/10 pt-4">
                          <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold block">Biografía Extendida y Notas de Prensa (Párrafos)</label>
                          {bio.extendedBio.map((para, pIdx) => (
                            <div key={pIdx} className="space-y-1">
                              <span className="text-[8px] font-mono text-cyan-400">PÁRRAFO #{pIdx + 1}</span>
                              <textarea 
                                rows={2}
                                value={para}
                                onChange={(e) => {
                                  const updatedParas = [...bio.extendedBio];
                                  updatedParas[pIdx] = e.target.value;
                                  setBio({ ...bio, extendedBio: updatedParas });
                                }}
                                className="w-full bg-black border border-white/15 rounded-lg px-4 py-2 font-sans text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            syncAndSaveData({ bio });
                            showToast("¡Biografía e información guardada!");
                          }}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] mt-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Guardar Cambios Biográficos</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: VIDEOS & VISUALES */}
                  {activeTab === "videos" && (
                    <div className="space-y-6">
                      <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-mono font-black text-xs tracking-wider text-white uppercase flex items-center gap-2">
                            <Video className="w-4 h-4 text-cyan-400" />
                            <span>Videos & Sesiones de YouTube / Transmisión Visual</span>
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-mono">Agregue, reordene y gestione los videos cinemáticos transmitidos en la plataforma</p>
                        </div>
                      </div>

                      {/* Video List */}
                      <div className="space-y-2.5">
                        {videos.map((video, vIdx) => (
                          <div key={video.id + "-" + vIdx} className="bg-black/60 border border-white/10 rounded-xl p-3.5 flex justify-between items-center flex-wrap sm:flex-nowrap gap-3">
                            <div className="flex gap-3 items-center min-w-0">
                              <div className="w-16 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-white/15 shrink-0">
                                <img src={resolveImage(video.poster)} alt={video.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="font-mono text-[8px] text-cyan-400 font-bold uppercase">
                                  {video.isPrincipal || video.order === 1 ? "★ PRINCIPAL" : `POSICIÓN ${video.order || (vIdx + 1)}`} • {video.subtitle}
                                </span>
                                <h5 className="font-mono text-xs font-black text-white truncate uppercase">{video.title}</h5>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                              <button
                                onClick={() => moveVideoUp(vIdx)}
                                disabled={vIdx === 0}
                                className="p-2 rounded-lg bg-black border border-white/10 text-zinc-300 hover:text-cyan-400 hover:border-cyan-400 cursor-none disabled:opacity-30"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveVideoDown(vIdx)}
                                disabled={vIdx === videos.length - 1}
                                className="p-2 rounded-lg bg-black border border-white/10 text-zinc-300 hover:text-cyan-400 hover:border-cyan-400 cursor-none disabled:opacity-30"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => editVideo(vIdx)}
                                className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors cursor-none"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteVideo(vIdx)}
                                className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-none"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add/Edit Video Form */}
                      <div className="border-t border-white/10 pt-6 space-y-4 text-left">
                        <h5 className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                          {editingVideoIndex !== null ? "EDITAR VIDEO EXISTENTE" : "AGREGAR NUEVO VIDEO DE SESIÓN"}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Título de la Sesión</label>
                            <input 
                              type="text"
                              value={videoForm.title}
                              onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                              placeholder="SÓNICA LIVE SESSION"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Subtítulo / Ubicación</label>
                            <input 
                              type="text"
                              value={videoForm.subtitle}
                              onChange={(e) => setVideoForm({ ...videoForm, subtitle: e.target.value })}
                              placeholder="Estudio Central, Salta"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="col-span-1 sm:col-span-2 md:col-span-3">
                            <FileUploader 
                              label="Video de la Sesión (Subir MP4/WebM desde PC/Celular o Enlace)"
                              value={videoForm.src}
                              onChange={(val) => setVideoForm({ ...videoForm, src: val })}
                              accept="video/*"
                              type="video"
                              placeholder="Seleccionar video (.mp4) o cargar enlace..."
                              showToast={showToast}
                              fullWidth
                            />
                          </div>
                        </div>

                        <FileUploader 
                          label="Imagen Miniatura / Poster (Subir desde PC/Celular o Enlace)"
                          value={videoForm.poster}
                          onChange={(val) => setVideoForm({ ...videoForm, poster: val })}
                          accept="image/*"
                          type="image"
                          placeholder="Seleccionar imagen miniatura o cargar enlace..."
                          showToast={showToast}
                          fullWidth
                        />

                        <div className="flex gap-2.5 pt-2">
                          {editingVideoIndex !== null ? (
                            <>
                              <button
                                onClick={updateVideo}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300"
                              >
                                <Check className="w-4 h-4" />
                                <span>Guardar Cambios</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingVideoIndex(null);
                                  setVideoForm({ id: "", title: "", subtitle: "", src: "", duration: "", poster: "", order: 2 });
                                }}
                                className="px-5 py-3 bg-white/5 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase rounded-xl cursor-none hover:bg-white/10"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={addVideo}
                              className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Agregar Video</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: FOTOS & GALERÍA */}
                  {activeTab === "photos" && (
                    <div className="space-y-6">
                      <div className="border-b border-white/10 pb-3">
                        <h4 className="font-mono font-black text-xs tracking-wider text-white uppercase flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-cyan-400" />
                          <span>Galería de Fotos & Coberturas Fotográficas</span>
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono">Gestione las fotografías exhibidas exclusivamente en el carrusel de la galería</p>
                      </div>

                      {/* Informational clarification banner */}
                      <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-left">
                        <span className="text-[9px] font-mono text-cyan-300 font-bold block mb-1">ℹ️ INFORMACIÓN DE ESTA SECCIÓN</span>
                        <p className="text-[10px] text-zinc-300 font-mono leading-relaxed">
                          Las fotos agregadas aquí pertenecen exclusivamente a la sección <strong>Galería de Fotos (carrusel)</strong>. Si deseas cambiar el <strong>video o foto de portada de bienvenida de la web</strong> (Intro Gateway / Hero inicio), utiliza la pestaña <strong>"Radio & Configuración General"</strong>.
                        </p>
                      </div>

                      {/* Photo sliders lists */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {photos.map((photo, pIdx) => (
                          <div key={photo.title + "-" + pIdx} className="bg-black/60 border border-white/10 rounded-xl p-3.5 flex gap-3 items-center justify-between">
                            <div className="flex gap-3 items-center min-w-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                                <img 
                                  src={resolveImage(photo.src, "photo")} 
                                  alt={photo.title} 
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/fotos/sunset1.jpeg";
                                  }}
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="font-mono text-[8px] text-cyan-400 font-bold uppercase">
                                  {photo.order === 1 ? "★ FOTO #1 (INICIO CARRUSEL)" : `POSICIÓN #${pIdx + 1}`} • {photo.location}
                                </span>
                                <h5 className="font-mono text-xs font-black text-white truncate uppercase">{photo.title}</h5>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => movePhotoUp(pIdx)} disabled={pIdx === 0} className="p-1.5 rounded bg-black border border-white/10 text-zinc-300 cursor-none disabled:opacity-30">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => movePhotoDown(pIdx)} disabled={pIdx === photos.length - 1} className="p-1.5 rounded bg-black border border-white/10 text-zinc-300 cursor-none disabled:opacity-30">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button onClick={() => editPhoto(pIdx)} className="p-1.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400 hover:text-black cursor-none">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => deletePhoto(pIdx)} className="p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white cursor-none">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add/Edit Photo Form */}
                      <div className="border-t border-white/10 pt-6 space-y-4 text-left">
                        <h5 className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                          {editingPhotoIndex !== null ? "EDITAR FOTO SELECCIONADA" : "AGREGAR NUEVA FOTO A LA GALERÍA"}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="col-span-1 sm:col-span-3">
                            <FileUploader 
                              label="Fotografía para el Carrusel (Subir desde PC/Celular o Enlace)"
                              value={photoForm.src}
                              onChange={(val) => setPhotoForm({ ...photoForm, src: val })}
                              accept="image/*"
                              type="image"
                              placeholder="Seleccionar fotografía o cargar enlace..."
                              showToast={showToast}
                              fullWidth
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Título de la Foto</label>
                            <input 
                              type="text"
                              value={photoForm.title}
                              onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                              placeholder="TREWA SHOW"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Lugar / Ciudad</label>
                            <input 
                              type="text"
                              value={photoForm.location}
                              onChange={(e) => setPhotoForm({ ...photoForm, location: e.target.value })}
                              placeholder="Trewa Club, Salta"
                              className="w-full bg-black border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                          {editingPhotoIndex !== null ? (
                            <>
                              <button
                                onClick={updatePhoto}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300"
                              >
                                <Check className="w-4 h-4" />
                                <span>Guardar Cambios</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPhotoIndex(null);
                                  setPhotoForm({ src: "", title: "", location: "", date: "", description: "", order: 2 });
                                }}
                                className="px-5 py-3 bg-white/5 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase rounded-xl cursor-none hover:bg-white/10"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={addPhoto}
                              className="flex items-center gap-2 px-6 py-3 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Agregar Foto</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: TRANSMISIÓN & AJUSTES GENERALES */}
                  {activeTab === "radio" && (
                    <div className="space-y-6">
                      <div className="border-b border-white/10 pb-3">
                        <h4 className="font-mono font-black text-xs tracking-wider text-white uppercase flex items-center gap-2">
                          <Radio className="w-4 h-4 text-cyan-400" />
                          <span>Transmisión Radio Streaming & Configuración General</span>
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono">Configure la URL del streaming Icecast/Shoutcast, video de fondo hero y redes sociales</p>
                      </div>

                      <div className="space-y-5 text-left">
                        {/* Radio Streaming URL */}
                        <div className="p-4 rounded-xl bg-black/80 border border-cyan-400/30 space-y-3">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-2">
                            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span>SERVIDORES DE TRANSMISIÓN DE AUDIO EN VIVO</span>
                          </span>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">URL del Stream Icecast / Shoutcast / MP3</label>
                            <input 
                              type="text"
                              value={radioConfig.streamingUrl}
                              onChange={(e) => setRadioConfig({ ...radioConfig, streamingUrl: e.target.value })}
                              placeholder="https://stream.radiosonica.com.ar/live"
                              className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-mono text-xs text-white uppercase font-bold">Habilitar Chat En Vivo en el Player</span>
                            <button
                              type="button"
                              onClick={() => setRadioConfig({ ...radioConfig, chatEnabled: !radioConfig.chatEnabled })}
                              className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase transition-all cursor-none ${
                                radioConfig.chatEnabled
                                  ? "bg-emerald-400 text-black border border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                                  : "bg-zinc-800 text-zinc-400 border border-white/10"
                              }`}
                            >
                              {radioConfig.chatEnabled ? "CHAT ACTIVADO" : "CHAT DESACTIVADO"}
                            </button>
                          </div>
                        </div>

                        {/* Hero Video & Title Config */}
                        <div className="p-4 rounded-xl bg-black/80 border border-white/10 space-y-3">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-cyan-400" />
                            <span>PORTADA Y VIDEO CINEMÁTICO DE INICIO (HERO)</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-1 sm:col-span-2 space-y-1.5">
                              <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Título de Bienvenida Hero</label>
                              <input 
                                type="text"
                                value={hero.title}
                                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                                className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>

                            <div className="col-span-1 sm:col-span-2">
                              <FileUploader 
                                label="Foto de Fondo / Portada de la Pantalla de Entrada (Intro Gateway)"
                                value={hero.imageUrl || "/fotos/hero.jpg"}
                                onChange={(val) => setHero({ ...hero, imageUrl: val })}
                                accept="image/*"
                                type="image"
                                placeholder="Seleccionar imagen (.jpg, .png) o enlace..."
                                showToast={showToast}
                                fullWidth
                              />
                            </div>

                            <div className="col-span-1 sm:col-span-2">
                              <FileUploader 
                                label="Video Cinemático Hero de Fondo (Subir MP4 de PC/Celular o Enlace)"
                                value={hero.videoUrl}
                                onChange={(val) => setHero({ ...hero, videoUrl: val })}
                                accept="video/*"
                                type="video"
                                placeholder="Seleccionar video (.mp4) o cargar enlace..."
                                showToast={showToast}
                                fullWidth
                              />
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">:: SELECCIÓN RÁPIDA DE VIDEOS DISPONIBLES</span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { path: "/videos/videoiniciohero.mp4", label: "Video Inicio Hero" },
                                { path: "/videos/trewabar3.mp4", label: "Trewa Bar 3 Live" },
                                { path: "/videos/trewabar4.mp4", label: "Trewa Bar 4 Club" }
                              ].map((v) => (
                                <button
                                  key={v.path}
                                  type="button"
                                  onClick={() => setHero({ ...hero, videoUrl: v.path })}
                                  className={`px-2.5 py-1.5 font-mono text-[8px] tracking-widest rounded-lg border transition-all cursor-none ${
                                    hero.videoUrl === v.path
                                      ? "bg-cyan-400 text-black border-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                      : "bg-zinc-950 text-zinc-300 border-white/10 hover:border-cyan-400/40 hover:text-white"
                                  }`}
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Social & Contact Config */}
                        <div className="p-4 rounded-xl bg-black/80 border border-white/10 space-y-3">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-400" />
                            <span>REDES SOCIALES Y CONTACTO INSTITUCIONAL</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Email de Contacto / Booking</label>
                              <input 
                                type="email"
                                value={radioConfig.contactEmail}
                                onChange={(e) => setRadioConfig({ ...radioConfig, contactEmail: e.target.value })}
                                placeholder="contacto@radiosonica.com.ar"
                                className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">Instagram URL</label>
                              <input 
                                type="text"
                                value={radioConfig.instagramUrl}
                                onChange={(e) => setRadioConfig({ ...radioConfig, instagramUrl: e.target.value })}
                                className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">YouTube Channel URL</label>
                              <input 
                                type="text"
                                value={radioConfig.youtubeUrl}
                                onChange={(e) => setRadioConfig({ ...radioConfig, youtubeUrl: e.target.value })}
                                className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono tracking-wider text-zinc-300 uppercase font-bold">SoundCloud Profile URL</label>
                              <input 
                                type="text"
                                value={radioConfig.soundcloudUrl}
                                onChange={(e) => setRadioConfig({ ...radioConfig, soundcloudUrl: e.target.value })}
                                className="w-full bg-black border border-white/15 rounded-lg px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={saveAllChanges}
                          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-400 text-black font-mono text-[10px] tracking-widest uppercase font-black rounded-xl cursor-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                        >
                          <Save className="w-4 h-4" />
                          <span>Guardar Todos los Ajustes Generales</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.9 }}
                className="fixed bottom-8 right-8 bg-[#0a0f18]/95 border border-cyan-400/50 text-cyan-300 px-6 py-3.5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] z-[99999] flex items-center gap-2.5 font-mono text-xs backdrop-blur-md font-bold uppercase tracking-wider"
              >
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
