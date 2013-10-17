---
title: "Speeding Up Windows Search Indexing Service"
layout: "post"
categories: [Windows, performance]
---

You may have noticed a process called `SearchIndexer.exe` (titled Windows Search Indexing Service on Windows 8) consuming large amounts of CPU and disk activity, and generally slowing down your computer.

This process builds an index of files that you might want to search through (by default, this only includes folders like My Documents) so that Windows can search them faster.  
Whenever you create or modify files in these folders, it needs to update the index.

If you create or modify large numbers of files, this can slow down your computer.

Run Process Monitor and filter Process Name as `SearchIndexer.exe`, then see what files it's reading.  Then, exclude those folders from indexing