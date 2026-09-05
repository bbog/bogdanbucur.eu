#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { minify: minifyJs } = require('terser');
const csso = require('csso');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Tooling/repo-meta files, plus the old undifferentiated files now superseded
// by their .en/.ro pairs. Never shipped, regardless of locale.
const EXCLUDE_NAMES = new Set([
	'dist',
	'node_modules',
	'scripts',
	'package.json',
	'package-lock.json',
	'CLAUDE.md',
	'README.md',
	'config.en.json',
	'config.ro.json',
	'config.example.json',
]);

// Matches "name.en.ext" / "name.ro.ext" -> [full, "name", "en"|"ro", ".ext"]
const LOCALE_FILE = /^(.+)\.(en|ro)(\.[^./\\]+)$/i;

// Placeholders in source/js/interactivity.*.js, resolved from config.<locale>.json
// at build time so real Ghost Content API keys never sit hardcoded in committed source.
const GHOST_TOKENS = {
	'__GHOST_PROGRAMMING_KEY__': 'ghost.programmingKey',
	'__GHOST_PERSONAL_KEY__': 'ghost.personalKey',
};

function parseLocale(argv) {
	const raw = (argv[2] || '').replace(/^--/, '').toLowerCase();
	if (raw !== 'en' && raw !== 'ro') {
		console.error('Usage: node scripts/build.js <en|ro>  (or: npm run build:en / npm run build:ro)');
		process.exit(1);
	}
	return raw;
}

function loadConfig(locale) {
	const configName = `config.${locale}.json`;
	const configPath = path.join(ROOT, configName);

	if (!fs.existsSync(configPath)) {
		console.error(`Missing ${configName}. Copy config.example.json to ${configName} and fill in the real Ghost Content API keys.`);
		process.exit(1);
	}

	const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

	for (const [token, keyPath] of Object.entries(GHOST_TOKENS)) {
		const value = keyPath.split('.').reduce((obj, key) => (obj || {})[key], config);
		if (!value) {
			console.error(`${configName} is missing a value at "${keyPath}" (needed to resolve ${token}).`);
			process.exit(1);
		}
	}

	return config;
}

function resolveToken(config, keyPath) {
	return keyPath.split('.').reduce((obj, key) => obj[key], config);
}

function shouldCopy(srcPath, locale) {
	const name = path.basename(srcPath);

	if (name.startsWith('.') || EXCLUDE_NAMES.has(name)) {
		return false;
	}

	const match = name.match(LOCALE_FILE);
	if (match) {
		return match[2].toLowerCase() === locale;
	}

	return true;
}

function stripLocaleSuffixes(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			stripLocaleSuffixes(full);
			continue;
		}

		const match = entry.name.match(LOCALE_FILE);
		if (match) {
			fs.renameSync(full, path.join(dir, match[1] + match[3]));
		}
	}
}

function substituteGhostTokens(filePath, config) {
	let content = fs.readFileSync(filePath, 'utf8');

	for (const [token, keyPath] of Object.entries(GHOST_TOKENS)) {
		content = content.split(token).join(resolveToken(config, keyPath));
	}

	const leftoverToken = content.match(/__[A-Z_]+__/);
	if (leftoverToken) {
		console.error(`${path.relative(ROOT, filePath)} still contains unresolved token ${leftoverToken[0]} after substitution.`);
		process.exit(1);
	}

	fs.writeFileSync(filePath, content);
}

async function minifyFile(filePath) {
	const ext = path.extname(filePath).toLowerCase();

	if (ext === '.js') {
		const source = fs.readFileSync(filePath, 'utf8');
		const result = await minifyJs(source);
		if (result.error) {
			throw result.error;
		}
		fs.writeFileSync(filePath, result.code);
	} else if (ext === '.css') {
		const source = fs.readFileSync(filePath, 'utf8');
		const result = csso.minify(source);
		fs.writeFileSync(filePath, result.css);
	}
}

async function minifyDir(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			await minifyDir(full);
		} else {
			await minifyFile(full);
		}
	}
}

async function build() {
	const locale = parseLocale(process.argv);
	const config = loadConfig(locale);

	fs.rmSync(DIST, { recursive: true, force: true });
	fs.mkdirSync(DIST);

	for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
		const srcPath = path.join(ROOT, entry.name);
		if (!shouldCopy(srcPath, locale)) {
			continue;
		}

		const destPath = path.join(DIST, entry.name);
		if (entry.isDirectory()) {
			fs.cpSync(srcPath, destPath, {
				recursive: true,
				filter: (src) => shouldCopy(src, locale),
			});
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}

	stripLocaleSuffixes(DIST);

	substituteGhostTokens(path.join(DIST, 'source', 'js', 'interactivity.js'), config);

	await minifyDir(DIST);

	console.log(`Built ${locale.toUpperCase()} site -> ${path.relative(ROOT, DIST)}/`);
}

build();
