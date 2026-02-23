# TAMUOnCHAIN-identity-layer

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/TAMU-SABAHAN/TAMUOnCHAIN-identity-layer/releases/tag/v0.1.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](docker-compose.yml)
[![Production Ready](https://img.shields.io/badge/production-ready-success.svg)]()

🏔️ **TAMU On-Chain (Identity Layer)**  
Empowering Kota Marudu, Sabah through Decentralized Identity.

**✨ v0.1.0 Released!** - [View Release Notes](RELEASE_NOTES.md) | [Roadmap](ROADMAP.md)

## 🎯 Visi Kami
Kami sedang membina lapisan identiti digital (Identity Layer) untuk komuniti di Kota Marudu. Projek ini bertujuan untuk membawa anak muda kita ke dalam ekonomi digital dunia menggunakan teknologi Web3.

### Sokongan Komuniti:
Di Kota Marudu, gaji purata adalah sekitar RM 1,500 ($250 - $280 USD). Ramai belia berbakat kita menghadapi kekangan peranti (HP/Tablet) yang mencukupi untuk belajar koding. Kami amat mengalu-alukan bantuan sukarelawan dan derma peranti.

## 🛠️ Status Projek
- **Identity**: Sign-In With Ethereum (SIWE)
- **Reputation**: On-chain scoring system (Skala 0-100)
- **Infrastructure**: Dockerized for easy deployment
- **Interface**: Web UI for ENS and referral management

## 🚀 Cara Menjalankan (Untuk Developer)

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Quick Start
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your configuration (especially `RPC_URL`)

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Access the web interface at: http://localhost:4000

### Local Development
```bash
npm install
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `GET /api/nonce` - Request authentication nonce
- `POST /api/verify` - Verify SIWE signature and bind referral code

### ENS Management
- `GET /api/ens/info` - Get ENS domain information

### Referral System
- `GET /api/referral/event` - Fetch referral event logs
- `POST /api/referral/event` - Log referral events (webhook-protected)

### Audit & Tracking
- `GET /api/referral/audit` - View audit event logs
- `POST /api/referral/audit` - Log audit events

### Reputation (Phase 2)
- `/api/reputation/*` - Reputation scoring endpoints

## 🌐 Web Interface Features

The web interface (accessible at `/`) provides:

1. **ENS Domain Management**
   - Direct navigation to ENS domains (e.g., jrsteve.eth)
   - View ENS information and status
   - Guided prompts for ENS setup

2. **Referral Code Registration**
   - User-friendly form for registering referral codes
   - Optional ENS name binding
   - Instructions for wallet integration

3. **Event Log Viewer**
   - Browse recent referral events
   - Paginated results
   - Clear formatting

4. **Audit Logging**
   - Log custom audit events
   - View audit trail
   - Admin tracking capabilities

## 🔐 Security Features
- Helmet.js security headers
- CORS protection
- Rate limiting (Phase 3A)
- Webhook secret validation
- ENS verification (forward and reverse)

## 📚 Documentation

- **[Release Notes](RELEASE_NOTES.md)** - Detailed v0.1.0 release information
- **[Roadmap](ROADMAP.md)** - Future phases and feature plans
- **[Contributing](CONTRIBUTING.md)** - How to contribute to the project
- **[Security Policy](SECURITY.md)** - Security guidelines and vulnerability reporting
- **[Changelog](CHANGELOG.md)** - Version history and changes

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.

Areas we need help:
- Code contributions and bug fixes
- Documentation and tutorials
- Testing and QA
- Translation (Malay and local languages)
- Community support

## 🔒 Security

Security is our top priority. If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for responsible disclosure.

**Do not** create public issues for security vulnerabilities. Contact us privately at Jrsteve900@gmail.com.

## 📞 Contact & Support

- **ENS**: jrsteve.eth, tamusabahan.eth
- **Email**: Jrsteve900@gmail.com
- **Twitter**: @Jrsteve10
- **GitHub**: @Jrsteve900
- **Location**: Kota Marudu, Sabah, Malaysia

## 🙏 Acknowledgments

- **jrsteve.eth** (JR. Steve) - Project Lead
- **TaMuSaBahan.eth** - Community Representative
- Kota Marudu Community - For the inspiration and support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🏔️ Built with Sabah Pride - Empowering Our Community Through Web3!**

*Version 0.1.0 - February 6, 2026*