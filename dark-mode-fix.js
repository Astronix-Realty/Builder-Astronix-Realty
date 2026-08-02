const fs = require('fs');
const path = require('path');

const targetFiles = [
    'app/builder/page.tsx',
    'components/builder/projects-form.tsx',
    'components/builder/towers-form.tsx',
    'components/builder/units-form.tsx',
    'components/builder/wizard-summary.tsx',
    'components/builder/forms/township-flow-form.tsx',
    'components/builder/forms/project-flow-form.tsx',
    'components/builder/forms/tower-flow-form.tsx',
    'components/builder/forms/unit-flow-form.tsx'
];

const classMap = {
    // Backgrounds
    'bg-white': 'bg-white dark:bg-slate-900',
    'bg-gray-50': 'bg-gray-50 dark:bg-slate-800/50',
    'bg-gray-100': 'bg-gray-100 dark:bg-slate-800',
    'bg-gray-200': 'bg-gray-200 dark:bg-slate-700',
    'bg-[#1A3C8C]/5': 'bg-[#1A3C8C]/5 dark:bg-slate-800/80',
    'bg-blue-50/50': 'bg-blue-50/50 dark:bg-blue-900/20',
    'bg-blue-50': 'bg-blue-50 dark:bg-blue-900/30',
    'bg-blue-100': 'bg-blue-100 dark:bg-blue-900/40',
    'bg-amber-50': 'bg-amber-50 dark:bg-amber-900/20',
    'bg-orange-50': 'bg-orange-50 dark:bg-orange-900/20',
    'bg-emerald-50': 'bg-emerald-50 dark:bg-emerald-900/20',
    'bg-red-50': 'bg-red-50 dark:bg-red-900/20',

    // Text
    'text-gray-900': 'text-gray-900 dark:text-white',
    'text-gray-800': 'text-gray-800 dark:text-slate-200',
    'text-gray-700': 'text-gray-700 dark:text-slate-300',
    'text-gray-600': 'text-gray-600 dark:text-slate-400',
    'text-gray-500': 'text-gray-500 dark:text-slate-500',
    'text-gray-400': 'text-gray-400 dark:text-slate-500',
    'text-gray-300': 'text-gray-300 dark:text-slate-600',
    
    // Borders
    'border-gray-200': 'border-gray-200 dark:border-slate-700',
    'border-gray-300': 'border-gray-300 dark:border-slate-600',
    'border-gray-100': 'border-gray-100 dark:border-slate-800',
    'border-blue-100': 'border-blue-100 dark:border-blue-900/50',
    'border-blue-200': 'border-blue-200 dark:border-blue-900/50',
    'border-amber-100': 'border-amber-100 dark:border-amber-900/30',
    'border-emerald-200': 'border-emerald-200 dark:border-emerald-900/30',
    'border-red-200': 'border-red-200 dark:border-red-900/30',
};

// Process each file
targetFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // A helper function to replace class name ensuring it is a whole word
    // and preventing double-adding of dark variants
    Object.keys(classMap).forEach(lightClass => {
        const replacement = classMap[lightClass];
        
        // We only want to replace if the light class is followed by a space, quote, or backtick,
        // and NOT followed by " dark:"
        // Use a regex that finds the lightClass, but ensures it's not already replaced
        const regex = new RegExp(`(?<!dark:)\\b${lightClass.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\//g, '\\/')}\\b(?!\\s+dark:)`, 'g');
        
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${file}`);
    } else {
        console.log(`No changes needed for: ${file}`);
    }
});
