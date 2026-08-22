// File: app/(auth)/get-started.tsx

import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useRef } from 'react';

const { width, height } = Dimensions.get('window');

export default function GetStarted() {
  const router = useRouter();
  const webViewRef = useRef(null);

  const globeHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      overflow: hidden; 
      background: #0a0a0f; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    }
    #root { 
      width: 100vw; 
      height: 100vh; 
      background: #0a0a0f; 
      position: relative; 
    }
    #globe-container { 
      width: 100%; 
      height: 100%; 
      position: relative; 
      background: #0a0a0f;
    }
    canvas { 
      display: block; 
      width: 100% !important; 
      height: 100% !important; 
    }
  </style>
</head>
<body>
  <div id="root">
    <div id="globe-container">
      <canvas id="globe-canvas"></canvas>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

  <script>
    // === Three.js Globe Implementation ===
    const container = document.getElementById('globe-container');
    const canvas = document.getElementById('globe-canvas');
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0f');

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.2, 6.0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true, 
      alpha: false 
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0f, 1);

    // === Globe Group - Centered ===
    const group = new THREE.Group();
    group.position.set(0, 0.1, 0);
    group.rotation.set(0.1, 0.3, 0.05);
    scene.add(group);

    const RADIUS = 1.6;
    const ACCENT = '#FFA500';

    // === Helper: Lat/Lon to Vector3 ===
    function latLonToVector3(lat, lon, radius) {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    // === Create Canvas Sprite for Text ===
    function createTextSprite(text, color, bgColor = 'white') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 256;
      canvas.height = 64;
      
      // Background with rounded corners
      const radius = 20;
      const x = 0;
      const y = 0;
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      
      ctx.fillStyle = bgColor;
      ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // Avatar circle
      const avatarX = 40;
      const avatarY = 32;
      const avatarRadius = 20;
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Avatar initial
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text[0], avatarX, avatarY);
      
      // Name text
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 70, 28);
      
      // Role text
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Member', 70, 48);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    // === Create Dot Sprite ===
    function createDotSprite() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.4, 'rgba(255,255,255,0.9)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    }

    // === Generate Land Dots ===
    function generateLandDots(count = 5000) {
      const positions = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        
        const lat = Math.asin(y) * 180 / Math.PI;
        const lon = Math.atan2(z, x) * 180 / Math.PI;
        
        const isLand = 
          (lat > -60 && lat < 80) && 
          !(lat > 20 && lat < 40 && lon > -130 && lon < -100) &&
          !(lat < -20 && lon > 80 && lon < 160) &&
          !(lat > 50 && lon > -180 && lon < -120);
        
        if (isLand) {
          positions.push(x * RADIUS, y * RADIUS, z * RADIUS);
        }
      }
      
      return new Float32Array(positions);
    }

    // === Create Land Dots ===
    const dotSprite = createDotSprite();
    const dotPositions = generateLandDots();
    
    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    
    const dotMaterial = new THREE.PointsMaterial({
      map: dotSprite,
      color: '#FFA500',
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    const dots = new THREE.Points(dotGeometry, dotMaterial);
    group.add(dots);

    // === Ocean Sphere ===
    const sphereGeometry = new THREE.SphereGeometry(RADIUS * 0.99, 64, 64);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: '#14161d'
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    // === Atmosphere ===
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { 
        uColor: { value: new THREE.Color(ACCENT) }
      },
      vertexShader: \`
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vPos = mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      \`,
      fragmentShader: \`
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vec3 viewDir = normalize(-vPos);
          float rim = 1.0 - abs(dot(vNormal, viewDir));
          float intensity = pow(rim, 4.2) * 0.8;
          gl_FragColor = vec4(uColor, intensity);
        }
      \`
    });
    
    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.12, 64, 64),
      atmosphereMaterial
    );
    group.add(atmosphereMesh);

    // === City Data with Names ===
    const cities = [
      { city: "Lagos", lat: 6.5244, lon: 3.3792, name: "Amara", color: "#FF6B35" },
      { city: "London", lat: 51.5072, lon: -0.1276, name: "James", color: "#4ECDC4" },
      { city: "New York", lat: 40.7128, lon: -74.006, name: "Sofia", color: "#45B7D1" },
      { city: "Nairobi", lat: -1.2921, lon: 36.8219, name: "Kwame", color: "#96CEB4" },
      { city: "Manila", lat: 14.5995, lon: 120.9842, name: "Yuki", color: "#FF6B6B" },
      { city: "São Paulo", lat: -23.5505, lon: -46.6333, name: "Mateus", color: "#FFEAA7" },
      { city: "Accra", lat: 5.6037, lon: -0.187, name: "Aisha", color: "#DDA0DD" },
      { city: "Tokyo", lat: 35.6762, lon: 139.6503, name: "Wei", color: "#98D8C8" },
      { city: "Cairo", lat: 30.0444, lon: 31.2357, name: "Fatima", color: "#F7DC6F" },
      { city: "Toronto", lat: 43.6532, lon: -79.3832, name: "Liam", color: "#85C1E9" },
      { city: "Kampala", lat: 0.3476, lon: 32.5825, name: "Naledi", color: "#82E0AA" },
      { city: "Sydney", lat: -33.8688, lon: 151.2093, name: "Chloe", color: "#F1948A" },
      { city: "Seoul", lat: 37.5665, lon: 126.978, name: "Hana", color: "#BB8FCE" },
      { city: "Berlin", lat: 52.52, lon: 13.405, name: "Ingrid", color: "#F8C471" },
      { city: "Mumbai", lat: 19.076, lon: 72.8777, name: "Ravi", color: "#73C6B6" },
      { city: "Shanghai", lat: 31.2304, lon: 121.4737, name: "Anya", color: "#E59866" },
      { city: "Istanbul", lat: 41.0082, lon: 28.9784, name: "Elif", color: "#AF7AC5" },
      { city: "Abuja", lat: 9.0765, lon: 7.3986, name: "Tunde", color: "#5DADE2" },
    ];

    // === Create City Markers and Name Labels ===
    const spriteMaterial = new THREE.SpriteMaterial({
      map: createTextSprite('Test Name', '#FF6B35'),
      transparent: true,
      depthTest: false,
      sizeAttenuation: true,
    });

    cities.forEach((city, index) => {
      const pos = latLonToVector3(city.lat, city.lon, RADIUS * 1.05);
      
      // 3D marker (small circle)
      const sphereGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const sphereMat = new THREE.MeshBasicMaterial({ color: city.color });
      const marker = new THREE.Mesh(sphereGeo, sphereMat);
      marker.position.copy(pos);
      group.add(marker);

      // Create name label as sprite
      const texture = createTextSprite(city.name, city.color);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        sizeAttenuation: true,
        opacity: 0.9,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(pos);
      sprite.position.multiplyScalar(1.15); // Move slightly outward
      sprite.scale.set(0.8, 0.2, 1);
      group.add(sprite);
    });

    // === Stars ===
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 200;
    const starsPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const v = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize().multiplyScalar(5 + Math.random() * 5);
      starsPositions[i * 3] = v.x;
      starsPositions[i * 3 + 1] = v.y;
      starsPositions[i * 3 + 2] = v.z;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: '#ffffff',
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // === Animation ===
    function animate() {
      requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      renderer.render(scene, camera);
    }
    animate();

    // === Resize Handler ===
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.globeContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: globeHTML }}
          style={styles.webview}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          containerStyle={styles.webviewContainer}
        />
      </View>

      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/goye_final_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.mainContent}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Welcome to Goye</Text>
              <Text style={styles.subtitle}>
                Begin your discipleship journey with a community of believers
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button} 
              onPress={() => router.push('/(auth)/account-type')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3F1F22', '#5A2F33']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.accountText}>
            Already have an account?{' '}
            <Text 
              style={styles.signInText}
              onPress={() => router.push('/(auth)/login')}
            >
              Sign In
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  globeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.15)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: { 
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: { 
    fontSize: 16, 
    color: 'white', 
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3F1F22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomSection: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(10, 10, 15, 0.6)',
  },
  accountText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
  },
  signInText: {
    color: '#FFA500',
    fontWeight: '600',
  },
});