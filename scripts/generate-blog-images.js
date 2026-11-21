const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'public', 'images', 'blog');

// Generate 5 distinct, high-tech modern blog cover SVGs
const images = [
  {
    id: 4,
    title: 'Networking Fundamentals',
    category: 'NETWORKING & CLOUD INFRASTRUCTURE',
    svg: `<svg width='1200' height='630' viewBox='0 0 1200 630' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <linearGradient id='bg4' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#060d1f'/>
          <stop offset='50%' stop-color='#0a192f'/>
          <stop offset='100%' stop-color='#040814'/>
        </linearGradient>
        <linearGradient id='cyanGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#00f2fe'/>
          <stop offset='100%' stop-color='#4facfe'/>
        </linearGradient>
        <radialGradient id='glow4' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#00f2fe' stop-opacity='0.25'/>
          <stop offset='100%' stop-color='#00f2fe' stop-opacity='0'/>
        </radialGradient>
        <filter id='shadow4' x='-20%' y='-20%' width='140%' height='140%'>
          <feDropShadow dx='0' dy='8' stdDeviation='16' flood-color='#00f2fe' flood-opacity='0.3'/>
        </filter>
      </defs>
      <rect width='1200' height='630' fill='url(#bg4)'/>
      
      <!-- Network Nodes & Connecting Mesh -->
      <circle cx='800' cy='315' r='280' fill='url(#glow4)'/>
      <g stroke='#38bdf8' stroke-width='2' opacity='0.6'>
        <line x1='600' y1='200' x2='750' y2='140' />
        <line x1='750' y1='140' x2='950' y2='180' />
        <line x1='950' y1='180' x2='1050' y2='315' />
        <line x1='1050' y1='315' x2='950' y2='450' />
        <line x1='950' y1='450' x2='750' y2='490' />
        <line x1='750' y1='490' x2='600' y2='430' />
        <line x1='600' y1='430' x2='600' y2='200' />
        
        <line x1='600' y1='200' x2='800' y2='315' />
        <line x1='750' y1='140' x2='800' y2='315' />
        <line x1='950' y1='180' x2='800' y2='315' />
        <line x1='1050' y1='315' x2='800' y2='315' />
        <line x1='950' y1='450' x2='800' y2='315' />
        <line x1='750' y1='490' x2='800' y2='315' />
        <line x1='600' y1='430' x2='800' y2='315' />
      </g>

      <!-- Central Core Switch/Router Node -->
      <circle cx='800' cy='315' r='55' fill='#0f172a' stroke='url(#cyanGrad)' stroke-width='4' filter='url(#shadow4)'/>
      <circle cx='800' cy='315' r='38' fill='none' stroke='#38bdf8' stroke-width='2' stroke-dasharray='6 4'/>
      <circle cx='800' cy='315' r='18' fill='url(#cyanGrad)'/>

      <!-- Perimeter Nodes -->
      <g>
        <circle cx='600' cy='200' r='24' fill='#0f172a' stroke='#38bdf8' stroke-width='3'/>
        <circle cx='600' cy='200' r='8' fill='#38bdf8'/>

        <circle cx='750' cy='140' r='28' fill='#0f172a' stroke='#00F260' stroke-width='3'/>
        <circle cx='750' cy='140' r='10' fill='#00F260'/>

        <circle cx='950' cy='180' r='24' fill='#0f172a' stroke='#38bdf8' stroke-width='3'/>
        <circle cx='950' cy='180' r='8' fill='#38bdf8'/>

        <circle cx='1050' cy='315' r='30' fill='#0f172a' stroke='#00F260' stroke-width='3'/>
        <circle cx='1050' cy='315' r='12' fill='#00F260'/>

        <circle cx='950' cy='450' r='24' fill='#0f172a' stroke='#38bdf8' stroke-width='3'/>
        <circle cx='950' cy='450' r='8' fill='#38bdf8'/>

        <circle cx='750' cy='490' r='28' fill='#0f172a' stroke='#00F260' stroke-width='3'/>
        <circle cx='750' cy='490' r='10' fill='#00F260'/>

        <circle cx='600' cy='430' r='24' fill='#0f172a' stroke='#38bdf8' stroke-width='3'/>
        <circle cx='600' cy='430' r='8' fill='#38bdf8'/>
      </g>

      <!-- Data Packets -->
      <circle cx='690' cy='250' r='6' fill='#facc15'/>
      <circle cx='880' cy='240' r='6' fill='#facc15'/>
      <circle cx='910' cy='375' r='6' fill='#facc15'/>
      <circle cx='700' cy='370' r='6' fill='#facc15'/>

      <!-- Left Badge & Typography -->
      <rect x='80' y='140' width='140' height='36' rx='18' fill='#00f2fe' fill-opacity='0.15' stroke='#00f2fe' stroke-width='1.5'/>
      <text x='150' y='163' font-family='sans-serif' font-size='13' font-weight='700' fill='#38bdf8' text-anchor='middle' letter-spacing='1'>NETWORKING</text>

      <text x='80' y='240' font-family='sans-serif' font-size='46' font-weight='800' fill='#ffffff'>Networking</text>
      <text x='80' y='295' font-family='sans-serif' font-size='46' font-weight='800' fill='#38bdf8'>Fundamentals</text>
      <text x='80' y='360' font-family='sans-serif' font-size='18' fill='#94a3b8'>From TCP/IP, OSI Layers to Software-Defined</text>
      <text x='80' y='390' font-family='sans-serif' font-size='18' fill='#94a3b8'>Cloud Networks (VPC, Subnets, Routing)</text>
      
      <!-- Tags Pill Row -->
      <g transform='translate(80, 460)'>
        <rect width='70' height='30' rx='6' fill='#1e293b'/>
        <text x='35' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>TCP/IP</text>
        <rect x='85' width='65' height='30' rx='6' fill='#1e293b'/>
        <text x='117' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>SDN</text>
        <rect x='165' width='70' height='30' rx='6' fill='#1e293b'/>
        <text x='200' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>Routing</text>
        <rect x='250' width='60' height='30' rx='6' fill='#1e293b'/>
        <text x='280' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>VPC</text>
      </g>
    </svg>`
  },
  {
    id: 5,
    title: 'DevOps CI/CD Pipeline',
    category: 'CLOUD & DEVOPS ENGINEERING',
    svg: `<svg width='1200' height='630' viewBox='0 0 1200 630' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <linearGradient id='bg5' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#0a0d1a'/>
          <stop offset='50%' stop-color='#111827'/>
          <stop offset='100%' stop-color='#030712'/>
        </linearGradient>
        <linearGradient id='orangeGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#f97316'/>
          <stop offset='100%' stop-color='#f59e0b'/>
        </linearGradient>
        <radialGradient id='glow5' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#f97316' stop-opacity='0.25'/>
          <stop offset='100%' stop-color='#f97316' stop-opacity='0'/>
        </radialGradient>
      </defs>
      <rect width='1200' height='630' fill='url(#bg5)'/>
      <circle cx='820' cy='315' r='290' fill='url(#glow5)'/>

      <!-- CI/CD Flow Blocks -->
      <g transform='translate(560, 160)'>
        <line x1='40' y1='155' x2='540' y2='155' stroke='#374151' stroke-width='6' stroke-dasharray='10 8'/>
        <line x1='40' y1='155' x2='480' y2='155' stroke='url(#orangeGrad)' stroke-width='6'/>

        <!-- Stage 1: Code -->
        <rect x='0' y='95' width='110' height='120' rx='16' fill='#1e293b' stroke='#3b82f6' stroke-width='3'/>
        <circle cx='55' cy='140' r='22' fill='#3b82f6' fill-opacity='0.2'/>
        <text x='55' y='146' font-family='monospace' font-size='18' font-weight='800' fill='#60a5fa' text-anchor='middle'>&lt;/&gt;</text>
        <text x='55' y='195' font-family='sans-serif' font-size='13' font-weight='700' fill='#e2e8f0' text-anchor='middle'>CODE</text>

        <!-- Stage 2: Build -->
        <rect x='140' y='95' width='110' height='120' rx='16' fill='#1e293b' stroke='#f59e0b' stroke-width='3'/>
        <circle cx='195' cy='140' r='22' fill='#f59e0b' fill-opacity='0.2'/>
        <text x='195' y='146' font-family='sans-serif' font-size='20' font-weight='800' fill='#fbbf24' text-anchor='middle'>⚙</text>
        <text x='195' y='195' font-family='sans-serif' font-size='13' font-weight='700' fill='#e2e8f0' text-anchor='middle'>BUILD</text>

        <!-- Stage 3: Test -->
        <rect x='280' y='95' width='110' height='120' rx='16' fill='#1e293b' stroke='#10b981' stroke-width='3'/>
        <circle cx='335' cy='140' r='22' fill='#10b981' fill-opacity='0.2'/>
        <text x='335' y='146' font-family='sans-serif' font-size='20' font-weight='800' fill='#34d399' text-anchor='middle'>✓</text>
        <text x='335' y='195' font-family='sans-serif' font-size='13' font-weight='700' fill='#e2e8f0' text-anchor='middle'>TEST</text>

        <!-- Stage 4: Deploy -->
        <rect x='420' y='95' width='120' height='120' rx='16' fill='#1e293b' stroke='url(#orangeGrad)' stroke-width='4'/>
        <circle cx='480' cy='140' r='26' fill='#f97316' fill-opacity='0.3'/>
        <text x='480' y='147' font-family='sans-serif' font-size='20' font-weight='800' fill='#fb923c' text-anchor='middle'>🚀</text>
        <text x='480' y='195' font-family='sans-serif' font-size='13' font-weight='800' fill='#fb923c' text-anchor='middle'>DEPLOY</text>
      </g>

      <!-- Left Badge & Typography -->
      <rect x='80' y='140' width='155' height='36' rx='18' fill='#f97316' fill-opacity='0.15' stroke='#f97316' stroke-width='1.5'/>
      <text x='157' y='163' font-family='sans-serif' font-size='13' font-weight='700' fill='#fb923c' text-anchor='middle' letter-spacing='1'>DEVOPS &amp; CI/CD</text>

      <text x='80' y='240' font-family='sans-serif' font-size='44' font-weight='800' fill='#ffffff'>CI/CD Pipeline</text>
      <text x='80' y='295' font-family='sans-serif' font-size='44' font-weight='800' fill='#fb923c'>Best Practices</text>
      <text x='80' y='360' font-family='sans-serif' font-size='18' fill='#94a3b8'>Automated Workflows, Ephemeral Secrets,</text>
      <text x='80' y='390' font-family='sans-serif' font-size='18' fill='#94a3b8'>Testing Pyramid &amp; Zero-Downtime Releases</text>

      <g transform='translate(80, 460)'>
        <rect width='110' height='30' rx='6' fill='#1e293b'/>
        <text x='55' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>GitHub Actions</text>
        <rect x='125' width='80' height='30' rx='6' fill='#1e293b'/>
        <text x='165' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>Terraform</text>
        <rect x='220' width='70' height='30' rx='6' fill='#1e293b'/>
        <text x='255' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>Docker</text>
      </g>
    </svg>`
  },
  {
    id: 6,
    title: 'Design Patterns',
    category: 'SOFTWARE ARCHITECTURE',
    svg: `<svg width='1200' height='630' viewBox='0 0 1200 630' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <linearGradient id='bg6' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#0d091e'/>
          <stop offset='50%' stop-color='#170f33'/>
          <stop offset='100%' stop-color='#080414'/>
        </linearGradient>
        <linearGradient id='purpleGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#c084fc'/>
          <stop offset='100%' stop-color='#6366f1'/>
        </linearGradient>
        <radialGradient id='glow6' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#818cf8' stop-opacity='0.25'/>
          <stop offset='100%' stop-color='#818cf8' stop-opacity='0'/>
        </radialGradient>
      </defs>
      <rect width='1200' height='630' fill='url(#bg6)'/>
      <circle cx='820' cy='315' r='300' fill='url(#glow6)'/>

      <!-- Hexagonal / Modular Pattern Diagram -->
      <g transform='translate(640, 140)'>
        <polygon points='180,60 270,110 270,210 180,260 90,210 90,110' fill='#1e1b4b' stroke='#a855f7' stroke-width='4'/>
        <text x='180' y='155' font-family='sans-serif' font-size='16' font-weight='800' fill='#c084fc' text-anchor='middle'>CORE</text>
        <text x='180' y='180' font-family='sans-serif' font-size='13' font-weight='600' fill='#e9d5ff' text-anchor='middle'>PATTERNS</text>

        <!-- Surrounding Modules -->
        <rect x='0' y='20' width='110' height='70' rx='10' fill='#2e1065' stroke='#818cf8' stroke-width='2'/>
        <text x='55' y='55' font-family='sans-serif' font-size='12' font-weight='700' fill='#c7d2fe' text-anchor='middle'>Strategy</text>
        <line x1='110' y1='55' x2='140' y2='85' stroke='#818cf8' stroke-width='2' stroke-dasharray='4 4'/>

        <rect x='250' y='20' width='110' height='70' rx='10' fill='#2e1065' stroke='#818cf8' stroke-width='2'/>
        <text x='305' y='55' font-family='sans-serif' font-size='12' font-weight='700' fill='#c7d2fe' text-anchor='middle'>Observer</text>
        <line x1='250' y1='55' x2='220' y2='85' stroke='#818cf8' stroke-width='2' stroke-dasharray='4 4'/>

        <rect x='0' y='240' width='110' height='70' rx='10' fill='#2e1065' stroke='#818cf8' stroke-width='2'/>
        <text x='55' y='275' font-family='sans-serif' font-size='12' font-weight='700' fill='#c7d2fe' text-anchor='middle'>CQRS</text>
        <line x1='110' y1='275' x2='140' y2='235' stroke='#818cf8' stroke-width='2' stroke-dasharray='4 4'/>

        <rect x='250' y='240' width='110' height='70' rx='10' fill='#2e1065' stroke='#818cf8' stroke-width='2'/>
        <text x='305' y='275' font-family='sans-serif' font-size='12' font-weight='700' fill='#c7d2fe' text-anchor='middle'>Repository</text>
        <line x1='250' y1='275' x2='220' y2='235' stroke='#818cf8' stroke-width='2' stroke-dasharray='4 4'/>
      </g>

      <!-- Left Badge & Typography -->
      <rect x='80' y='140' width='190' height='36' rx='18' fill='#818cf8' fill-opacity='0.15' stroke='#818cf8' stroke-width='1.5'/>
      <text x='175' y='163' font-family='sans-serif' font-size='13' font-weight='700' fill='#a5b4fc' text-anchor='middle' letter-spacing='1'>SOFTWARE ARCHITECTURE</text>

      <text x='80' y='240' font-family='sans-serif' font-size='44' font-weight='800' fill='#ffffff'>Software Design</text>
      <text x='80' y='295' font-family='sans-serif' font-size='44' font-weight='800' fill='#c084fc'>Patterns in 2025</text>
      <text x='80' y='360' font-family='sans-serif' font-size='18' fill='#94a3b8'>From Strategy to CQRS: Enterprise Architectural</text>
      <text x='80' y='390' font-family='sans-serif' font-size='18' fill='#94a3b8'>Patterns with Modern TypeScript Examples</text>

      <g transform='translate(80, 460)'>
        <rect width='90' height='30' rx='6' fill='#1e1b4b'/>
        <text x='45' y='20' font-family='sans-serif' font-size='12' fill='#c7d2fe' text-anchor='middle'>TypeScript</text>
        <rect x='105' width='80' height='30' rx='6' fill='#1e1b4b'/>
        <text x='145' y='20' font-family='sans-serif' font-size='12' fill='#c7d2fe' text-anchor='middle'>Patterns</text>
        <rect x='200' width='60' height='30' rx='6' fill='#1e1b4b'/>
        <text x='230' y='20' font-family='sans-serif' font-size='12' fill='#c7d2fe' text-anchor='middle'>CQRS</text>
      </g>
    </svg>`
  },
  {
    id: 7,
    title: 'Kubernetes Service Mesh',
    category: 'CLOUD & DEVOPS',
    svg: `<svg width='1200' height='630' viewBox='0 0 1200 630' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <linearGradient id='bg7' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#04171d'/>
          <stop offset='50%' stop-color='#082832'/>
          <stop offset='100%' stop-color='#020c10'/>
        </linearGradient>
        <linearGradient id='cyanGreenGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#10b981'/>
          <stop offset='100%' stop-color='#06b6d4'/>
        </linearGradient>
        <radialGradient id='glow7' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#06b6d4' stop-opacity='0.25'/>
          <stop offset='100%' stop-color='#06b6d4' stop-opacity='0'/>
        </radialGradient>
      </defs>
      <rect width='1200' height='630' fill='url(#bg7)'/>
      <circle cx='820' cy='315' r='290' fill='url(#glow7)'/>

      <!-- Pod Clusters and Mesh Lines -->
      <g transform='translate(600, 140)'>
        <!-- Service Pod 1 -->
        <rect x='40' y='40' width='130' height='100' rx='12' fill='#083344' stroke='#06b6d4' stroke-width='2'/>
        <text x='105' y='80' font-family='sans-serif' font-size='13' font-weight='700' fill='#e0f2fe' text-anchor='middle'>Pod A (App)</text>
        <rect x='55' y='95' width='100' height='26' rx='6' fill='#0e7490'/>
        <text x='105' y='112' font-family='sans-serif' font-size='10' font-weight='600' fill='#cffafe' text-anchor='middle'>Sidecar Proxy</text>

        <!-- Service Pod 2 -->
        <rect x='270' y='40' width='130' height='100' rx='12' fill='#083344' stroke='#10b981' stroke-width='2'/>
        <text x='335' y='80' font-family='sans-serif' font-size='13' font-weight='700' fill='#ecfdf5' text-anchor='middle'>Pod B (API)</text>
        <rect x='285' y='95' width='100' height='26' rx='6' fill='#059669'/>
        <text x='335' y='112' font-family='sans-serif' font-size='10' font-weight='600' fill='#d1fae5' text-anchor='middle'>Sidecar Proxy</text>

        <!-- Service Pod 3 -->
        <rect x='155' y='210' width='140' height='100' rx='12' fill='#083344' stroke='#38bdf8' stroke-width='2'/>
        <text x='225' y='250' font-family='sans-serif' font-size='13' font-weight='700' fill='#f0f9ff' text-anchor='middle'>Pod C (Auth)</text>
        <rect x='175' y='265' width='100' height='26' rx='6' fill='#0284c7'/>
        <text x='225' y='282' font-family='sans-serif' font-size='10' font-weight='600' fill='#e0f2fe' text-anchor='middle'>Sidecar Proxy</text>

        <!-- mTLS Mesh Connections -->
        <line x1='155' y1='108' x2='285' y2='108' stroke='#38bdf8' stroke-width='3' stroke-dasharray='6 4'/>
        <line x1='105' y1='121' x2='180' y2='220' stroke='#38bdf8' stroke-width='3' stroke-dasharray='6 4'/>
        <line x1='335' y1='121' x2='270' y2='220' stroke='#38bdf8' stroke-width='3' stroke-dasharray='6 4'/>
      </g>

      <!-- Left Badge & Typography -->
      <rect x='80' y='140' width='190' height='36' rx='18' fill='#06b6d4' fill-opacity='0.15' stroke='#06b6d4' stroke-width='1.5'/>
      <text x='175' y='163' font-family='sans-serif' font-size='13' font-weight='700' fill='#22d3ee' text-anchor='middle' letter-spacing='1'>KUBERNETES &amp; MESH</text>

      <text x='80' y='240' font-family='sans-serif' font-size='44' font-weight='800' fill='#ffffff'>Cloud Networking</text>
      <text x='80' y='295' font-family='sans-serif' font-size='44' font-weight='800' fill='#06b6d4'>Kubernetes Service Mesh</text>
      <text x='80' y='360' font-family='sans-serif' font-size='18' fill='#94a3b8'>Traffic Splitting, Mutual TLS Encryption &amp;</text>
      <text x='80' y='390' font-family='sans-serif' font-size='18' fill='#94a3b8'>Full Telemetry with Istio and Linkerd</text>

      <g transform='translate(80, 460)'>
        <rect width='90' height='30' rx='6' fill='#083344'/>
        <text x='45' y='20' font-family='sans-serif' font-size='12' fill='#cffafe' text-anchor='middle'>Kubernetes</text>
        <rect x='105' width='60' height='30' rx='6' fill='#083344'/>
        <text x='135' y='20' font-family='sans-serif' font-size='12' fill='#cffafe' text-anchor='middle'>Istio</text>
        <rect x='180' width='60' height='30' rx='6' fill='#083344'/>
        <text x='210' y='20' font-family='sans-serif' font-size='12' fill='#cffafe' text-anchor='middle'>mTLS</text>
      </g>
    </svg>`
  },
  {
    id: 8,
    title: 'Microservices Testing',
    category: 'SOFTWARE ENGINEERING',
    svg: `<svg width='1200' height='630' viewBox='0 0 1200 630' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <linearGradient id='bg8' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#0f172a'/>
          <stop offset='50%' stop-color='#1e293b'/>
          <stop offset='100%' stop-color='#020617'/>
        </linearGradient>
        <linearGradient id='amberGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='#fbbf24'/>
          <stop offset='100%' stop-color='#f59e0b'/>
        </linearGradient>
        <radialGradient id='glow8' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='#f59e0b' stop-opacity='0.25'/>
          <stop offset='100%' stop-color='#f59e0b' stop-opacity='0'/>
        </radialGradient>
      </defs>
      <rect width='1200' height='630' fill='url(#bg8)'/>
      <circle cx='820' cy='315' r='290' fill='url(#glow8)'/>

      <!-- Testing Pyramid Graphic -->
      <g transform='translate(650, 160)'>
        <!-- Tier 1: E2E Tests (Top) -->
        <polygon points='175,20 120,90 230,90' fill='#ef4444' fill-opacity='0.3' stroke='#f87171' stroke-width='2'/>
        <text x='175' y='70' font-family='sans-serif' font-size='12' font-weight='800' fill='#fca5a5' text-anchor='middle'>E2E</text>

        <!-- Tier 2: Integration & Contract Tests (Middle) -->
        <polygon points='115,96 60,176 290,176 235,96' fill='#f59e0b' fill-opacity='0.3' stroke='#fbbf24' stroke-width='2'/>
        <text x='175' y='145' font-family='sans-serif' font-size='13' font-weight='800' fill='#fde68a' text-anchor='middle'>Contract &amp; Integration</text>

        <!-- Tier 3: Unit Tests (Base) -->
        <polygon points='55,182 0,265 350,265 295,182' fill='#10b981' fill-opacity='0.3' stroke='#34d399' stroke-width='2'/>
        <text x='175' y='235' font-family='sans-serif' font-size='14' font-weight='800' fill='#a7f3d0' text-anchor='middle'>Unit Tests (Fast &amp; Isolated)</text>
      </g>

      <!-- Left Badge & Typography -->
      <rect x='80' y='140' width='180' height='36' rx='18' fill='#f59e0b' fill-opacity='0.15' stroke='#f59e0b' stroke-width='1.5'/>
      <text x='170' y='163' font-family='sans-serif' font-size='13' font-weight='700' fill='#fbbf24' text-anchor='middle' letter-spacing='1'>QUALITY &amp; TESTING</text>

      <text x='80' y='240' font-family='sans-serif' font-size='44' font-weight='800' fill='#ffffff'>Microservices Testing</text>
      <text x='80' y='295' font-family='sans-serif' font-size='44' font-weight='800' fill='#fbbf24'>Strategies for 2025</text>
      <text x='80' y='360' font-family='sans-serif' font-size='18' fill='#94a3b8'>From Unit and Pact Contract Testing to</text>
      <text x='80' y='390' font-family='sans-serif' font-size='18' fill='#94a3b8'>Testcontainers and Chaos Engineering</text>

      <g transform='translate(80, 460)'>
        <rect width='70' height='30' rx='6' fill='#1e293b'/>
        <text x='35' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>Pact</text>
        <rect x='85' width='100' height='30' rx='6' fill='#1e293b'/>
        <text x='135' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>Testcontainers</text>
        <rect x='200' width='110' height='30' rx='6' fill='#1e293b'/>
        <text x='255' y='20' font-family='sans-serif' font-size='12' fill='#cbd5e1' text-anchor='middle'>Chaos Mesh</text>
      </g>
    </svg>`
  }
];

async function generate() {
  for (const item of images) {
    const svgBuffer = Buffer.from(item.svg);
    const jpgPath = path.join(outDir, `blog_${item.id}.jpg`);
    const pngPath = path.join(outDir, `blog_${item.id}.png`);

    // Write JPG
    await sharp(svgBuffer).jpeg({ quality: 92 }).toFile(jpgPath);
    console.log('Generated JPG:', jpgPath);

    // Write PNG
    await sharp(svgBuffer).png().toFile(pngPath);
    console.log('Generated PNG:', pngPath);
  }
  console.log('All 5 high-resolution blog covers generated successfully!');
}

generate().catch(console.error);
