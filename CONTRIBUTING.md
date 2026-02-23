# Contributing to TAMUOnCHAIN Identity Layer

## 🤝 Welcome!
We're building this for the Sabah community and beyond. Your contributions matter!

Thank you for considering contributing to TAMUOnCHAIN Identity Layer. This project aims to empower the community in Kota Marudu, Sabah, through decentralized identity technology. Whether you're a seasoned developer or just starting out, there's a place for you here.

## 🎯 Areas We Need Help

### 1. Code Contributions
- **Bug Fixes**: Help us squash bugs and improve stability
- **Feature Implementations**: See [ROADMAP.md](ROADMAP.md) for upcoming features
- **Performance Optimizations**: Make the platform faster and more efficient
- **Test Coverage**: Improve test coverage and quality assurance
- **Security Enhancements**: Help identify and fix security vulnerabilities

### 2. Documentation
- **API Documentation**: Improve endpoint documentation
- **Tutorial Creation**: Create step-by-step guides for users
- **Translation**: Translate docs to Malay and local Sabah languages
- **Video Guides**: Create video tutorials for the community
- **Code Comments**: Improve code readability

### 3. Community Support
- **Answering Questions**: Help other users in issues and discussions
- **Testing and QA**: Test new features and report bugs
- **User Feedback**: Share your experience and suggestions
- **Spreading Awareness**: Share the project with others

### 4. Design & UX
- **UI/UX Design**: Improve the web interface
- **Accessibility**: Ensure the platform is accessible to all users
- **Mobile Responsiveness**: Optimize for mobile devices
- **User Research**: Conduct user testing and gather feedback

## 🛠️ Development Setup

### Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Click the "Fork" button on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/TAMUOnCHAIN-identity-layer.git
   cd TAMUOnCHAIN-identity-layer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   # At minimum, set RPC_URL to an Ethereum RPC endpoint
   ```

4. **Start Development Services**
   ```bash
   # Start PostgreSQL and Redis with Docker
   docker-compose up -d postgres redis
   
   # Run database migrations
   # (if migration script exists)
   
   # Start development server
   npm run dev
   ```

5. **Verify Setup**
   - Open http://localhost:4000 in your browser
   - You should see the web interface

### Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow the coding standards (see below)
   - Add tests for new features
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run TypeScript compilation
   npm run build
   
   # Test the application
   npm start
   
   # Run any existing tests
   # npm test (if test script exists)
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for test additions
   - `chore:` for maintenance tasks

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

## 📋 Pull Request Process

### Before Submitting
- [ ] Code compiles without errors (`npm run build`)
- [ ] Application runs successfully (`npm start`)
- [ ] Changes are tested manually
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional commits
- [ ] No secrets or sensitive data in code

### PR Description Template
```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Related Issue
Fixes #(issue number)

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented if any)
```

### Review Process
1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged!

## 🏷️ Branch Naming Conventions

Use descriptive branch names with appropriate prefixes:

- `feature/` - New features (e.g., `feature/magic-link-auth`)
- `fix/` - Bug fixes (e.g., `fix/ens-resolution-error`)
- `docs/` - Documentation (e.g., `docs/api-examples`)
- `refactor/` - Code improvements (e.g., `refactor/reputation-module`)
- `test/` - Test additions (e.g., `test/siwe-verification`)
- `chore/` - Maintenance (e.g., `chore/update-dependencies`)

## ✅ Code Standards

### TypeScript Guidelines
- Use TypeScript strict mode
- Define proper types for all functions and variables
- Avoid `any` type unless absolutely necessary
- Use interfaces for object structures
- Export types for reusability

### Code Style
- Use ESLint configuration (if present)
- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Maximum line length: 100 characters
- Use meaningful variable and function names

### Example
```typescript
// Good ✅
interface UserProfile {
  address: string;
  ensName?: string;
  reputation: number;
}

async function getUserProfile(address: string): Promise<UserProfile> {
  // Implementation
}

// Avoid ❌
async function getProfile(addr: any): Promise<any> {
  // Implementation
}
```

### Comments
- Add comments for complex logic
- Use JSDoc for public functions
- Keep comments up-to-date with code changes

```typescript
/**
 * Verifies a SIWE signature and returns the authenticated address
 * @param message - The SIWE message object
 * @param signature - The signature to verify
 * @returns The verified Ethereum address
 * @throws Error if signature is invalid
 */
async function verifySignature(message: SiweMessage, signature: string): Promise<string> {
  // Implementation
}
```

### Security Best Practices
- Never commit secrets or private keys
- Use environment variables for sensitive config
- Validate all user inputs
- Use parameterized queries for database operations
- Sanitize data before logging
- Follow principle of least privilege

## 🧪 Testing Guidelines

### Manual Testing
1. Test the happy path (expected behavior)
2. Test edge cases (empty inputs, null values)
3. Test error scenarios
4. Test with different user roles/permissions
5. Test on different devices/browsers (if UI changes)

### Writing Tests (when test infrastructure exists)
- Write unit tests for utility functions
- Write integration tests for API endpoints
- Aim for meaningful test coverage
- Use descriptive test names
- Test both success and failure cases

## 📚 Documentation Guidelines

### Code Documentation
- Document all public APIs
- Explain complex algorithms
- Include usage examples
- Keep README.md updated

### API Documentation
When adding or modifying endpoints, update documentation with:
- Endpoint path and method
- Request parameters
- Request body (if applicable)
- Response format
- Error codes
- Usage examples

### Example
```markdown
#### POST /api/verify

Verify a SIWE signature and authenticate user.

**Request Body:**
```json
{
  "message": "...",
  "signature": "0x...",
  "referralCode": "optional-code"
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "ensName": "user.eth"
}
```

**Errors:**
- `400` - Invalid signature or message
- `500` - Server error
```

## 🔒 Security

### Reporting Vulnerabilities
**DO NOT** open public issues for security vulnerabilities.

Report privately to:
- ENS: jrsteve.eth
- Email: Jrsteve900@gmail.com
- Twitter DM: @Jrsteve10

Expected response: Within 48 hours

### Security Checklist
- [ ] No hardcoded secrets
- [ ] Environment variables used for sensitive data
- [ ] Input validation implemented
- [ ] SQL injection prevented (use parameterized queries)
- [ ] XSS prevention (sanitize outputs)
- [ ] CSRF protection (when applicable)
- [ ] Rate limiting considered
- [ ] Authentication/authorization checked

## 🌍 Community Values

### Code of Conduct
We are committed to providing a welcoming and inclusive environment.

**Our Standards:**
- Be respectful and inclusive
- Be collaborative and supportive
- Focus on what's best for the community
- Show empathy towards others
- Accept constructive criticism gracefully

**Unacceptable Behavior:**
- Harassment or discriminatory language
- Personal attacks or insults
- Trolling or inflammatory comments
- Publishing others' private information
- Other unprofessional conduct

**Enforcement:**
Violations may result in warnings, temporary bans, or permanent bans from the project.

### Community Context
This project is built for Kota Marudu, Sabah, where:
- Average salary is ~RM 1,500 ($250-280 USD)
- Many talented youth face device constraints
- Community empowerment is our primary goal
- We value **tulus** (authentic), **no bocor** (quality), and **masa depan** (future-proof)

## 🎓 Learning Resources

### Web3 & Blockchain
- [Ethereum.org Developer Docs](https://ethereum.org/developers)
- [SIWE Specification (EIP-4361)](https://eips.ethereum.org/EIPS/eip-4361)
- [ENS Documentation](https://docs.ens.domains/)
- [ethers.js Documentation](https://docs.ethers.org/)

### TypeScript & Node.js
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### Tools
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/tutorial/)

## 🏆 Recognition

### Contributors
All contributors will be recognized in:
- Repository contributors list
- Release notes acknowledgments
- Community showcases

### Types of Contributions Valued
- Code contributions
- Documentation improvements
- Bug reports
- Feature suggestions
- Community support
- Testing and QA
- Design and UX
- Translations
- Spreading awareness

## 📞 Getting Help

### Channels
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: Jrsteve900@gmail.com for direct communication
- **Twitter**: @Jrsteve10 for updates and community

### Questions?
Don't hesitate to ask! We're here to help:
1. Check existing documentation
2. Search closed issues
3. Open a new issue or discussion
4. Tag maintainers if urgent

## 🚀 First-Time Contributors

New to open source? Welcome! Here's how to get started:

1. **Start Small**: Look for `good-first-issue` labels
2. **Read the Docs**: Familiarize yourself with the project
3. **Ask Questions**: Don't be shy, we're here to help
4. **Be Patient**: Reviews may take time
5. **Learn**: Every contribution is a learning opportunity

### Good First Issues
- Documentation improvements
- Code comment additions
- Bug fixes
- Test coverage
- UI improvements
- Translation additions

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. Together, we're building something meaningful for the Sabah community and beyond.

**🏔️ Built with Sabah Pride - Empowering Our Community Through Web3!**

---

**Contact:**
- Project Lead: jrsteve.eth (JR. Steve)
- Location: Kota Marudu, Sabah, Malaysia
- Email: Jrsteve900@gmail.com
- Twitter: @Jrsteve10
