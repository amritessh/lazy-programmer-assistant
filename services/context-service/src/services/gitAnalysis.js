import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs-extra';

class GitAnalysis {
  constructor() {
    this.maxCommits = 100;
    this.maxDaysBack = 30;
    this.git = simpleGit();
  }

  /**
   * Analyze git repository for context
   */
  async analyzeRepository(repoPath) {
    try {
      const git = simpleGit(repoPath);

      // Check if it's a git repository
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        throw new Error('Not a git repository');
      }

      // Get basic repository info
      const repoInfo = await this.getRepositoryInfo(git);

      // Get recent commits
      const recentCommits = await this.getRecentCommits(git);

      // Get file changes
      const fileChanges = await this.getRecentFileChanges(git);

      // Get branch information
      const branchInfo = await this.getBranchInfo(git);

      // Get working directory status
      const status = await this.getWorkingDirectoryStatus(git);

      // Analyze commit patterns
      const commitPatterns = this.analyzeCommitPatterns(recentCommits);

      // Get file activity
      const fileActivity = this.analyzeFileActivity(recentCommits);

      return {
        isGitRepo: true,
        repoInfo,
        branchInfo,
        status,
        recentCommits: recentCommits.slice(0, 20), // Top 20 recent commits
        fileChanges: fileChanges.slice(0, 50), // Top 50 recent file changes
        commitPatterns,
        fileActivity,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.message.includes('Not a git repository')) {
        return {
          isGitRepo: false,
          reason: 'Directory is not a git repository'
        };
      }

      console.error('Git analysis error:', error);
      throw new Error(`Git analysis failed: ${error.message}`);
    }
  }

  /**
   * Get basic repository information
   */
  async getRepositoryInfo(git) {
    try {
      const remotes = await git.getRemotes(true);
      const tags = await git.tags();

      // Try to get repository URL
      let repoUrl = null;
      const originRemote = remotes.find(r => r.name === 'origin');
      if (originRemote) {
        repoUrl = originRemote.refs.fetch || originRemote.refs.push;
      }

      return {
        remotes: remotes.map(r => ({
          name: r.name,
          url: r.refs.fetch || r.refs.push
        })),
        tags: tags.latest
          ? {
              latest: tags.latest,
              all: tags.all.slice(-10) // Last 10 tags
            }
          : null,
        repoUrl
      };
    } catch (error) {
      console.warn('Could not get full repository info:', error.message);
      return {
        remotes: [],
        tags: null,
        repoUrl: null
      };
    }
  }

  /**
   * Get recent commits
   */
  async getRecentCommits(git) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - this.maxDaysBack);

      const log = await git.log({
        maxCount: this.maxCommits,
        since: since.toISOString()
      });

      return log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: {
          name: commit.author_name,
          email: commit.author_email
        },
        refs: commit.refs || '',
        body: commit.body || ''
      }));
    } catch (error) {
      console.warn('Could not get recent commits:', error.message);
      return [];
    }
  }

  /**
   * Get recent file changes
   */
  async getRecentFileChanges(git) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - this.maxDaysBack);

      const log = await git.log({
        maxCount: this.maxCommits,
        since: since.toISOString(),
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae'
        }
      });

      const fileChanges = [];

      // Get file changes for each commit
      for (const commit of log.all.slice(0, 20)) {
        // Limit to 20 commits for performance
        try {
          const diffSummary = await git.diffSummary([
            `${commit.hash}^`,
            commit.hash
          ]);

          if (diffSummary && diffSummary.files) {
            diffSummary.files.forEach(file => {
              fileChanges.push({
                file: file.file,
                changes: file.changes,
                insertions: file.insertions,
                deletions: file.deletions,
                binary: file.binary || false,
                commit: {
                  hash: commit.hash,
                  date: commit.date,
                  message: commit.message,
                  author: commit.author_name
                }
              });
            });
          }
        } catch (diffError) {
          // Skip commits where diff fails
          continue;
        }
      }

      // Sort by date (most recent first)
      return fileChanges.sort(
        (a, b) => new Date(b.commit.date) - new Date(a.commit.date)
      );
    } catch (error) {
      console.warn('Could not get file changes:', error.message);
      return [];
    }
  }

  /**
   * Get branch information
   */
  async getBranchInfo(git) {
    try {
      const summary = await git.branch();
      const local = await git.branchLocal();

      let remote = null;
      try {
        remote = await git.branch(['-r']);
      } catch (remoteError) {
        // No remote branches or other error
      }

      return {
        current: summary.current,
        all: summary.all,
        local: local.all,
        remote: remote ? remote.all : [],
        total: summary.all.length
      };
    } catch (error) {
      console.warn('Could not get branch info:', error.message);
      return {
        current: null,
        all: [],
        local: [],
        remote: [],
        total: 0
      };
    }
  }

  /**
   * Get working directory status
   */
  async getWorkingDirectoryStatus(git) {
    try {
      const status = await git.status();

      return {
        ahead: status.ahead || 0,
        behind: status.behind || 0,
        current: status.current,
        tracking: status.tracking,
        modified: status.modified || [],
        created: status.created || [],
        deleted: status.deleted || [],
        renamed: status.renamed || [],
        staged: status.staged || [],
        conflicted: status.conflicted || [],
        isClean: status.isClean()
      };
    } catch (error) {
      console.warn('Could not get working directory status:', error.message);
      return {
        ahead: 0,
        behind: 0,
        current: null,
        tracking: null,
        modified: [],
        created: [],
        deleted: [],
        renamed: [],
        staged: [],
        conflicted: [],
        isClean: true
      };
    }
  }

  /**
   * Analyze commit patterns
   */
  analyzeCommitPatterns(commits) {
    if (commits.length === 0) {
      return {
        totalCommits: 0,
        averagePerDay: 0,
        topAuthors: [],
        commitTypes: {},
        timeDistribution: {}
      };
    }

    // Author analysis
    const authorCounts = {};
    commits.forEach(commit => {
      const author = commit.author.name;
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });

    const topAuthors = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, commits: count }));

    // Commit type analysis (based on message patterns)
    const commitTypes = {};
    const typePatterns = {
      feat: /^(feat|feature)/i,
      fix: /^(fix|bugfix)/i,
      docs: /^docs/i,
      style: /^style/i,
      refactor: /^refactor/i,
      test: /^test/i,
      chore: /^chore/i,
      build: /^build/i,
      ci: /^ci/i
    };

    commits.forEach(commit => {
      let type = 'other';
      for (const [typeName, pattern] of Object.entries(typePatterns)) {
        if (pattern.test(commit.message)) {
          type = typeName;
          break;
        }
      }
      commitTypes[type] = (commitTypes[type] || 0) + 1;
    });

    // Time distribution analysis
    const timeDistribution = {};
    commits.forEach(commit => {
      const hour = new Date(commit.date).getHours();
      const timeSlot = this.getTimeSlot(hour);
      timeDistribution[timeSlot] = (timeDistribution[timeSlot] || 0) + 1;
    });

    // Calculate average commits per day
    const dates = commits.map(c => new Date(c.date).toDateString());
    const uniqueDates = [...new Set(dates)];
    const averagePerDay = commits.length / Math.max(uniqueDates.length, 1);

    return {
      totalCommits: commits.length,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      topAuthors,
      commitTypes,
      timeDistribution,
      activeDays: uniqueDates.length
    };
  }

  /**
   * Analyze file activity patterns
   */
  analyzeFileActivity(commits) {
    const fileFrequency = {};
    const fileAuthors = {};

    commits.forEach(commit => {
      // This is simplified - in a real implementation you'd need to get
      // the file list from each commit's diff
      const message = commit.message.toLowerCase();

      // Extract potential file references from commit messages
      const fileMatches = message.match(
        /\b[\w-]+\.(js|ts|jsx|tsx|py|java|cs|cpp|html|css|scss|json|md)\b/g
      );

      if (fileMatches) {
        fileMatches.forEach(file => {
          fileFrequency[file] = (fileFrequency[file] || 0) + 1;

          if (!fileAuthors[file]) {
            fileAuthors[file] = new Set();
          }
          fileAuthors[file].add(commit.author.name);
        });
      }
    });

    // Convert Sets to arrays and get top files
    const topFiles = Object.entries(fileFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([file, frequency]) => ({
        file,
        frequency,
        authors: Array.from(fileAuthors[file] || [])
      }));

    return {
      topFiles,
      totalFilesModified: Object.keys(fileFrequency).length
    };
  }

  /**
   * Get time slot for commit time analysis
   */
  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Get file history for specific file
   */
  async getFileHistory(repoPath, filePath, limit = 10) {
    try {
      const git = simpleGit(repoPath);

      const log = await git.log({
        file: filePath,
        maxCount: limit
      });

      return log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: {
          name: commit.author_name,
          email: commit.author_email
        }
      }));
    } catch (error) {
      console.warn(
        `Could not get history for file ${filePath}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Get diff for specific commit
   */
  async getCommitDiff(repoPath, commitHash) {
    try {
      const git = simpleGit(repoPath);

      const diff = await git.diff([`${commitHash}^`, commitHash]);
      const diffSummary = await git.diffSummary([`${commitHash}^`, commitHash]);

      return {
        summary: diffSummary,
        diff: diff
      };
    } catch (error) {
      console.warn(
        `Could not get diff for commit ${commitHash}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Check if path is in a git repository
   */
  async isGitRepository(repoPath) {
    try {
      const git = simpleGit(repoPath);
      return await git.checkIsRepo();
    } catch (error) {
      return false;
    }
  }
}

export default new GitAnalysis();
