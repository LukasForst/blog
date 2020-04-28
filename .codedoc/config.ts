
import { configuration } from '@codedoc/core';

import { theme } from './theme';


export const config = configuration({
  theme,
  src: {                                 // @see /docs/config/entry
    base: 'markdown',                     // --> the base folder for all markdowns
    toc: '_toc.md',                      // --> markdown file for toc, relative to `base`
    pick: /\.md$/,                       // --> which files to pick (default: .md files)
    drop: /(^_)|(\/_)/,                  // --> which files to drop (default: _something.md files)
  },
  dest: {                                // @see /docs/config/output
    html: 'dist',                           // --> the base folder for HTML files
    assets: 'dist',                         // --> the base folder for assets
    bundle: '.',               // --> where to store codedoc's bundle (relative to `assets`)
    styles: 'styles',               // --> where to store codedoc's styles (relative to `assets`)
    namespace: '',                       // --> project namespace
  },
  page: {
    title: {
      base: 'Blog'                        // --> the base title of your doc pages
    }
  },
  misc: {
    github: {
      user: 'LukasForst',            // --> name of the user on GitHub owning the repo
      repo: 'blog',         // --> name of the repo on GitHub
      action: 'Star',             // --> action of the GitHub button
      count: false,               // --> whether to show the `count` on the GitHub button
      large: true,                // --> whether to show a `large` GitHub button
      standardIcon: false,        // --> whether to use the GitHub icon on the GitHub button or use an action specific icon
    }
  },
  
});
