import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const config = {
  slidesToShow: 6,
  centerMode: true,
  gap: 4,
};

const images: { id: number, label: string, src: string, color: string }[] = [
  { id: 0, label: 'Single tittle', src: 'https://cdn.cosmos.so/db97045d-a24f-4c76-ab54-90f28e8a2425?format=jpeg', color: '#4e544b' },
  { id: 1, label: 'Slide 2', src: 'https://cdn.cosmos.so/cab09f3b-1b9a-4a21-9807-5f2b75926da3?format=jpeg', color: '#8b5a2b' },
  { id: 2, label: 'Slide 3', src: 'https://cdn.cosmos.so/e9fa0ead-0bf0-4d78-892a-e75722ef8697?format=jpeg', color: '#2b5a8b' },
  { id: 3, label: 'Slide 4', src: 'https://cdn.cosmos.so/20e87ba3-a6be-472f-aa10-d1a7d1fa72d1?format=jpeg', color: '#5a8b2b' },
  { id: 4, label: 'Slide 5', src: 'https://cdn.cosmos.so/3c6d14b1-6ace-4233-b02d-53b036d9f0a3?format=jpeg', color: '#8b2b5a' },
  { id: 5, label: 'Slide 6', src: 'https://cdn.cosmos.so/c152cae9-0882-407b-ac41-e14702de66f5?format=jpeg', color: '#2b8b5a' },
];

function App() {
  let currentLogicalIndex = 0;
  let currentPhysicalIndex = 0;
  let slides: any[] = [];
  let isTransitioning = false;

  let sideSlideSize = 0;
  let centerSlideSize = 0;
  let isMobile = window.innerWidth <= 768;

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const currentColor = useRef(images[0].color);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const animateBackground = contextSafe((newColor: string) => {
    const baseBg = document.getElementById('base-bg');
    if (!bgOverlayRef.current || !baseBg) return;


    gsap.set(bgOverlayRef.current, {
      "--bg-gradient-color": newColor,
      clipPath: 'circle(3.2% at 50% 50%)',
      opacity: 1,
    });
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
    tl.to(bgOverlayRef.current, {
      clipPath: 'circle(90.0% at 50% 50%)',
      duration: 1,
    })
      .to(baseBg, { "--bg-gradient-color": newColor, ease: 'power3.inOut' }, "<0.1")
      .to(bgOverlayRef.current, { opacity: 0 });
  });

  useEffect(() => {
    if (!sliderRef || !trackRef) return;

    function calculateWidths() {
      const sliderWrapper = sliderRef.current;
      if (!sliderWrapper) return;
      const containerSize = isMobile ? sliderWrapper.offsetHeight : sliderWrapper.offsetWidth;
      const totalGaps = config.gap * (config.slidesToShow - 1);
      const availableSize = containerSize - totalGaps;

      if (config.centerMode) {
        centerSlideSize = availableSize * 0.5;
        sideSlideSize = (availableSize - centerSlideSize) / (config.slidesToShow - 1);
      } else {
        sideSlideSize = availableSize / config.slidesToShow;
        centerSlideSize = sideSlideSize;
      }
    }

    function createSlide(item: { id: number, label: string, src: string }) {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.dataset.label = item.label;
      slide.dataset.id = item.id.toString();
      slide.innerHTML = `<img src="${item.src}" alt="${item.label}">`;
      return slide;
    }

    function buildInfiniteTrack() {
      trackRef.current!.innerHTML = '';
      calculateWidths();
      const repeatCount = 20;
      // conver this into jsx
      for (let rep = 0; rep < repeatCount; rep++) {
        images.forEach(item => {
          const slide = createSlide(item);
          trackRef.current?.appendChild(slide);
        });
      }

      slides = Array.from(trackRef.current?.children || []);
      currentPhysicalIndex = Math.floor(slides.length / 2);
      currentLogicalIndex = currentPhysicalIndex % images.length;
      applyWidths();
    }

    function applyWidths() {
      slides.forEach((slide, index) => {
        const isCenter = index === currentPhysicalIndex && config.centerMode;
        const size = isCenter ? centerSlideSize : sideSlideSize;

        if (isMobile) {
          slide.style.height = `${size}px`;
          slide.style.marginTop = '0px';
          slide.style.marginBottom = `${config.gap}px`;
        } else {
          slide.style.width = `${size}px`;
          slide.style.height = '380px';
          slide.style.marginLeft = '0px';
          slide.style.marginRight = `${config.gap}px`;
        }
      });

      if (slides.length > 0) {
        if (isMobile) {
          slides[slides.length - 1].style.marginBottom = '0px';
        } else {
          slides[slides.length - 1].style.marginRight = '0px';
        }
      }
    }

    function getCenterOffset(slideIndex: number) {
      const sliderWrapper = sliderRef.current;
      if (!sliderWrapper) return 0;
      const containerCenter = isMobile ? sliderWrapper.offsetHeight / 2 : sliderWrapper.offsetWidth / 2;
      let offset = 0;

      for (let i = 0; i < slideIndex; i++) {
        const size = (i === currentPhysicalIndex) ? centerSlideSize : sideSlideSize;
        offset += size + config.gap;
      }

      const currentSize = (slideIndex === currentPhysicalIndex) ? centerSlideSize : sideSlideSize;
      offset += currentSize / 2;

      return offset - containerCenter;
    }

    function updateSlider(animate = true) {
      if (isTransitioning && animate) return;
      applyWidths();

      slides.forEach(slide => slide.classList.remove('active'));
      if (slides[currentPhysicalIndex] && config.centerMode) {
        slides[currentPhysicalIndex].classList.add('active');
      }

      const offset = getCenterOffset(currentPhysicalIndex);
      const direction = isMobile ? 'translateY' : 'translateX';
      trackRef.current!.style.transition = animate ? 'transform 0.6s ease' : 'none';
      trackRef.current!.style.transform = `${direction}(-${offset}px)`;

      if (animate) {
        const targetColor = images[currentLogicalIndex].color;
        if (targetColor !== currentColor.current) {
          animateBackground(targetColor);
          currentColor.current = targetColor;
        }

        isTransitioning = true;
        setTimeout(() => {
          isTransitioning = false;
          resetPositionIfNeeded();
        }, 300);
      }
    }

    function resetPositionIfNeeded() {
      const resetThreshold = images.length * 2;
      const middlePosition = Math.floor(slides.length / 2);
      if (currentPhysicalIndex < resetThreshold || currentPhysicalIndex > slides.length - resetThreshold) {
        const targetLogical = currentLogicalIndex;
        currentPhysicalIndex = middlePosition + (targetLogical - (middlePosition % images.length));
        updateSlider(false);
      }
    }

    function nextSlide() {
      if (isTransitioning) return;
      currentPhysicalIndex++;
      currentLogicalIndex = (currentLogicalIndex + 1) % images.length;
      updateSlider(true);
    }

    function prevSlide() {
      if (isTransitioning) return;
      currentPhysicalIndex--;
      currentLogicalIndex = (currentLogicalIndex - 1 + images.length) % images.length;
      updateSlider(true);
    }

    // Calcula la diferencia entre el índice clickeado y el actual, y desplaza el slider a esa posición
    function goToSlide(targetPhysicalIndex: number) {
      if (isTransitioning || currentPhysicalIndex === targetPhysicalIndex) return;

      const difference = targetPhysicalIndex - currentPhysicalIndex;
      currentPhysicalIndex = targetPhysicalIndex;
      currentLogicalIndex = (currentLogicalIndex + difference) % images.length;

      // Asegurarse de que el índice lógico se mantenga positivo en caso de retroceder
      if (currentLogicalIndex < 0) currentLogicalIndex += images.length;

      updateSlider(true);
    }

    // Funciones extraídas para manejar eventos y permitir una limpieza (cleanup) adecuada
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevSlide();
    };

    const handleResize = () => {
      isMobile = window.innerWidth <= 768;
      calculateWidths();
      applyWidths();
      updateSlider(false);
    };

    // Delegación de eventos: captura el click en cualquier imagen usando el contenedor base trackRef
    const handleTrackClick = (e: MouseEvent) => {
      const slide = (e.target as HTMLElement).closest('.slide');
      if (slide) {
        // Obtenemos el índice del elemento clickeado basándonos en nuestro arreglo de slides referenciados
        const index = slides.indexOf(slide as any);
        if (index !== -1) {
          goToSlide(index);
        }
      }
    };

    function bindEvents() {
      document.querySelector('.next-button')?.addEventListener('click', nextSlide);
      document.querySelector('.prev-button')?.addEventListener('click', prevSlide);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);

      // Listener agregado para permitir clicks sobre las imágenes y volverlas 'active'
      trackRef.current?.addEventListener('click', handleTrackClick);
    }


    buildInfiniteTrack();
    updateSlider(false);
    bindEvents();

    // Función de limpieza de useEffect (Cleanup)
    // Se utilizan referencias específicas para cada función para asegurar que los listeners se remuevan correctamente al desmontar el componente
    return () => {
      document.querySelector('.next-button')?.removeEventListener('click', nextSlide);
      document.querySelector('.prev-button')?.removeEventListener('click', prevSlide);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      trackRef.current?.removeEventListener('click', handleTrackClick);
    }

  }, [trackRef, sliderRef]);


  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 z-[-2]"
        id="base-bg"
        style={{
          "--bg-gradient-color": images[0].color,
          backgroundImage: "radial-gradient(circle at center, #1a1d1a 0%, var(--bg-gradient-color) 35%, #000000 100%)"
        } as React.CSSProperties}
      ></div>
      <div
        ref={bgOverlayRef}
        className="absolute inset-0 z-[-1] opacity-0"
        style={{
          clipPath: 'circle(3.2% at 50% 50%)',
          backgroundImage: "radial-gradient(circle at center, #1a1d1a 0%, var(--bg-gradient-color) 35%, #000000 100%)"
        } as React.CSSProperties}
      ></div>

      <div ref={sliderRef} className="slider-wrapper">
        <div ref={trackRef} className="slider-track" id="sliderTrack"></div>
      </div>
      <div className="flex gap-8 mt-20">
        <button className="nav-button prev-button">&#10094;</button>
        <button className="nav-button next-button">&#10095;</button>
      </div>
    </div>
  )
}

export default App
