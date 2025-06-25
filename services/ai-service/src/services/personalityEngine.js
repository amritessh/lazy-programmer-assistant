// services/ai-service/src/services/personalityEngine.js
const { PERSONALITY_RESPONSES } = require('@lpa/shared');

class PersonalityEngine {
  constructor() {
    // Different sass levels and their characteristics
    this.sassLevels = {
      1: { name: 'Polite', tone: 'professional', helpfulness: 'high' },
      2: { name: 'Friendly', tone: 'casual', helpfulness: 'high' },
      3: { name: 'Mildly Sarcastic', tone: 'playful', helpfulness: 'high' },
      4: { name: 'Sarcastic', tone: 'witty', helpfulness: 'medium-high' },
      5: {
        name: 'Moderately Sassy',
        tone: 'sassy',
        helpfulness: 'medium-high'
      },
      6: { name: 'Sassy', tone: 'sassy', helpfulness: 'medium' },
      7: { name: 'Very Sassy', tone: 'very-sassy', helpfulness: 'medium' },
      8: { name: 'Brutally Honest', tone: 'brutal', helpfulness: 'medium' },
      9: { name: 'Savage', tone: 'savage', helpfulness: 'low-medium' },
      10: { name: 'Maximum Sass', tone: 'maximum', helpfulness: 'low' }
    };

    // Response templates by sass level
    this.responseTemplates = {
      1: {
        greeting: "I'd be happy to help you with that.",
        assumptions: "I'm assuming you need {assumption}.",
        codeIntro: "Here's a solution for your request:",
        explanation: "This code accomplishes what you're looking for."
      },
      3: {
        greeting:
          'Alright, let me see what I can do with that... creative request.',
        assumptions:
          "I'm going to assume you meant {assumption}, but feel free to clarify.",
        codeIntro: "Here's what I think you're after:",
        explanation:
          "This should do what you're looking for, assuming I decoded your request correctly."
      },
      5: {
        greeting:
          "Oh, '{input}' - truly the pinnacle of technical specification.",
        assumptions:
          "Since you were so... descriptive, I'm assuming you want {assumption}.",
        codeIntro:
          "Here's my interpretation of your highly detailed requirements:",
        explanation:
          'This code does what I think you probably meant to ask for.'
      },
      7: {
        greeting:
          "Wow, '{input}' - such clarity, such precision. I'm practically reading your mind here.",
        assumptions:
          'Let me just consult my crystal ball... ah yes, you want {assumption}.',
        codeIntro:
          'Behold, the code that magically transforms your vague mumbling into reality:',
        explanation:
          "This masterpiece interprets your... let's call it 'abstract' request."
      },
      10: {
        greeting:
          "'{input}' - Chef's kiss. Truly a work of art in the medium of vague mumbling.",
        assumptions:
          "Since you've given me approximately zero useful information, I'm assuming {assumption}.",
        codeIntro:
          "Here's the code that somehow makes sense of whatever that was supposed to be:",
        explanation:
          'This code does what you should have asked for if you knew how to ask for things properly.'
      }
    };

    // Sassy phrases for different situations
    this.sassyPhrases = {
      vague_request: [
        "Oh, so we're being *super* specific today, I see.",
        "That's... definitely words in an order.",
        "Let me just read your mind since you're being so descriptive.",
        "Ah yes, the classic 'you know what I mean' approach.",
        "I love how you've really thought this through."
      ],
      thing_reference: [
        "Ah yes, 'the thing' - my favorite technical specification.",
        "'The thing' - because naming things is hard, right?",
        "Let me guess, 'the thing' is very important and needs to work.",
        "I see we're using the highly technical term 'thing' today."
      ],
      make_it_work: [
        'Make it work? Revolutionary concept.',
        "Oh, you want it to *work*? That's a new requirement.",
        'Working code? What a novel idea.',
        "I suppose 'making it work' is better than 'making it broken'."
      ],
      assumptions: [
        "I'm making more assumptions than a soap opera plot.",
        'Since you left out approximately 90% of the details...',
        'Let me fill in the blanks you so generously left.',
        "I'll just assume you meant something useful."
      ]
    };

    // Helpful phrases to balance the sass
    this.helpfulPhrases = [
      "But don't worry, I've got you covered.",
      "Lucky for you, I speak fluent 'vague'.",
      "Fortunately, I'm good at guessing what people actually want.",
      "I'll translate this into something that actually works.",
      "Here's what you probably meant to ask for."
    ];
  }

  /**
   * Add personality to a response based on sass level
   */
  addPersonality(explanation, originalRequest, personalitySettings = {}) {
    const {
      sassLevel = 5,
      verbosity = 'detailed',
      explanationStyle = 'casual'
    } = personalitySettings;

    // Clamp sass level between 1-10
    const clampedSassLevel = Math.max(1, Math.min(10, sassLevel));

    // Get appropriate response template
    const template = this.getTemplate(clampedSassLevel);

    // Generate sassy introduction
    const sassyIntro = this.generateSassyIntro(
      originalRequest,
      clampedSassLevel
    );

    // Add personality to explanation
    const personalizedExplanation = this.personalizeExplanation(
      explanation,
      clampedSassLevel,
      explanationStyle
    );

    // Add helpful conclusion
    const helpfulConclusion = this.generateHelpfulConclusion(clampedSassLevel);

    // Combine all parts
    let response = sassyIntro;

    if (verbosity !== 'brief') {
      response += '\n\n' + personalizedExplanation;
    }

    if (clampedSassLevel <= 7) {
      // Don't be too helpful at maximum sass
      response += '\n\n' + helpfulConclusion;
    }

    return response;
  }

  /**
   * Get response template for sass level
   */
  getTemplate(sassLevel) {
    // Find the closest template (we have templates for levels 1, 3, 5, 7, 10)
    const availableLevels = [1, 3, 5, 7, 10];
    const closestLevel = availableLevels.reduce(
      (prev, curr) =>
        Math.abs(curr - sassLevel) < Math.abs(prev - sassLevel) ? curr : prev
    );

    return this.responseTemplates[closestLevel];
  }

  /**
   * Generate sassy introduction
   */
  generateSassyIntro(originalRequest, sassLevel) {
    const template = this.getTemplate(sassLevel);

    // Replace {input} placeholder with the original request
    let intro = template.greeting.replace('{input}', originalRequest);

    // Add specific sass based on request patterns
    if (this.containsThingReference(originalRequest)) {
      const thingPhrase = this.getRandomPhrase('thing_reference', sassLevel);
      intro += ' ' + thingPhrase;
    }

    if (this.containsMakeItWork(originalRequest)) {
      const workPhrase = this.getRandomPhrase('make_it_work', sassLevel);
      intro += ' ' + workPhrase;
    }

    return intro;
  }

  /**
   * Personalize the explanation
   */
  personalizeExplanation(explanation, sassLevel, style) {
    let personalizedExplanation = explanation;

    // Add sass modifiers based on level
    if (sassLevel >= 6) {
      personalizedExplanation = this.addSassyModifiers(personalizedExplanation);
    }

    // Adjust tone based on style
    if (style === 'technical') {
      personalizedExplanation = this.makeTechnical(personalizedExplanation);
    } else if (style === 'casual') {
      personalizedExplanation = this.makeCasual(personalizedExplanation);
    }

    return personalizedExplanation;
  }

  /**
   * Generate helpful conclusion
   */
  generateHelpfulConclusion(sassLevel) {
    if (sassLevel <= 3) {
      return 'Hope this helps! Let me know if you need any clarification.';
    } else if (sassLevel <= 6) {
      return "This should do what you're looking for. You're welcome for the mind-reading service.";
    } else {
      return 'There you go. Try to be more specific next time, it makes both our lives easier.';
    }
  }

  /**
   * Add sassy modifiers to text
   */
  addSassyModifiers(text) {
    // Add italics to emphasize sarcasm
    text = text.replace(
      /\b(obviously|clearly|simply|just|merely|only)\b/gi,
      '*$1*'
    );

    // Add quotes around questionable terms
    text = text.replace(/\b(thing|stuff|it|that)\b/gi, '"$1"');

    return text;
  }

  /**
   * Make explanation more technical
   */
  makeTechnical(explanation) {
    // Add technical phrases
    const technicalPhrases = [
      'implementation',
      'functionality',
      'architecture',
      'methodology',
      'optimization'
    ];

    // This is a simplified version - in practice, you'd use NLP to make it more technical
    return explanation;
  }

  /**
   * Make explanation more casual
   */
  makeCasual(explanation) {
    // Replace formal terms with casual ones
    return explanation
      .replace(/\bfunctionality\b/gi, 'features')
      .replace(/\bimplement\b/gi, 'build')
      .replace(/\butilize\b/gi, 'use')
      .replace(/\bparameters\b/gi, 'inputs');
  }

  /**
   * Check if request contains "thing" references
   */
  containsThingReference(text) {
    return /\b(the|that|this)\s+(thing|stuff|object|component|element|widget)\b/i.test(
      text
    );
  }

  /**
   * Check if request contains "make it work" patterns
   */
  containsMakeItWork(text) {
    return /\bmake\s+(it|the\s+\w+)\s+(work|do|happen)\b/i.test(text);
  }

  /**
   * Get random phrase from category, scaled by sass level
   */
  getRandomPhrase(category, sassLevel) {
    const phrases = this.sassyPhrases[category] || [];
    if (phrases.length === 0) return '';

    // For lower sass levels, use milder phrases or skip entirely
    if (sassLevel <= 3 && Math.random() > 0.3) {
      return '';
    }

    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
  }

  /**
   * Generate assumption text with personality
   */
  generateAssumptionText(assumptions, sassLevel) {
    if (!assumptions || assumptions.length === 0) {
      return '';
    }

    const template = this.getTemplate(sassLevel);
    let assumptionText = '';

    if (sassLevel >= 5) {
      assumptionText = this.getRandomPhrase('assumptions', sassLevel) + '\n\n';
    }

    assumptionText += "Here's what I'm assuming:\n";
    assumptions.forEach((assumption, index) => {
      const prefix = sassLevel >= 6 ? '🔮' : '•';
      assumptionText += `${prefix} ${assumption}\n`;
    });

    return assumptionText;
  }

  /**
   * Generate code introduction with personality
   */
  generateCodeIntro(sassLevel, codeType = 'code') {
    const template = this.getTemplate(sassLevel);
    let intro = template.codeIntro;

    // Add code type specific intro
    const codeIntros = {
      component: "Here's your shiny new component:",
      function: 'Behold, a function that actually works:',
      fix: "Here's the fix for your... situation:",
      api: 'Your API endpoint, as requested:',
      style: 'Some CSS to make things less ugly:'
    };

    if (codeIntros[codeType]) {
      intro = codeIntros[codeType];
    }

    // Add sass modifiers
    if (sassLevel >= 7) {
      intro = '✨ ' + intro + ' ✨';
    }

    return intro;
  }

  /**
   * Generate clarifying questions with personality
   */
  generateClarifyingQuestions(questions, sassLevel) {
    if (!questions || questions.length === 0) {
      return '';
    }

    let questionText = '';

    if (sassLevel <= 3) {
      questionText = 'To better help you, could you clarify:\n\n';
    } else if (sassLevel <= 6) {
      questionText = 'Since you were a bit... vague, I need to know:\n\n';
    } else {
      questionText =
        "Look, I'm good, but I'm not a mind reader. Help me out here:\n\n";
    }

    questions.forEach((question, index) => {
      questionText += `${index + 1}. ${question}\n`;
    });

    return questionText;
  }

  /**
   * Generate error message with personality
   */
  generateErrorResponse(error, sassLevel = 5) {
    const errorResponses = {
      1: `I apologize, but I encountered an error: ${error}`,
      3: `Oops, something went wrong: ${error}`,
      5: `Well, this is awkward. I ran into an issue: ${error}`,
      7: `Great, now you've broken me too: ${error}`,
      10: `Congratulations, you've achieved the impossible - you confused an AI: ${error}`
    };

    const template = this.getTemplate(sassLevel);
    const closestLevel = Object.keys(errorResponses)
      .map(Number)
      .reduce(
        (prev, curr) =>
          Math.abs(curr - sassLevel) < Math.abs(prev - sassLevel) ? curr : prev
      );

    return errorResponses[closestLevel];
  }

  /**
   * Generate success message with personality
   */
  generateSuccessResponse(sassLevel = 5) {
    const successResponses = {
      1: 'Task completed successfully!',
      3: 'There you go! All done.',
      5: "Mission accomplished. You're welcome.",
      7: "Done. That wasn't so hard, was it?",
      10: 'Boom. Another vague request conquered by yours truly.'
    };

    const closestLevel = Object.keys(successResponses)
      .map(Number)
      .reduce(
        (prev, curr) =>
          Math.abs(curr - sassLevel) < Math.abs(prev - sassLevel) ? curr : prev
      );

    return successResponses[closestLevel];
  }

  /**
   * Adjust response based on user history
   */
  adjustForUserHistory(response, userHistory = {}) {
    const {
      totalInteractions = 0,
      successfulGenerations = 0,
      commonPatterns = []
    } = userHistory;

    // Be more helpful for new users
    if (totalInteractions < 5) {
      response = this.makeMoreHelpful(response);
    }

    // Be more patient if user often has successful generations
    if (successfulGenerations / Math.max(totalInteractions, 1) > 0.8) {
      response = this.reduceSnark(response);
    }

    // Reference common patterns
    if (commonPatterns.length > 0) {
      const pattern = commonPatterns[0];
      response += `\n\n(I notice you often ask about ${pattern.phrase} - I'm getting pretty good at interpreting your... unique style.)`;
    }

    return response;
  }

  /**
   * Make response more helpful
   */
  makeMoreHelpful(response) {
    // Add helpful tips and explanations
    const helpfulTips = [
      '💡 Tip: The more specific you are, the better I can help!',
      '🔍 Pro tip: Mentioning the file or component name helps me understand context.',
      '⚡ Hint: Describing what you want the code to do makes my job easier.'
    ];

    const randomTip =
      helpfulTips[Math.floor(Math.random() * helpfulTips.length)];
    return response + '\n\n' + randomTip;
  }

  /**
   * Reduce snark in response
   */
  reduceSnark(response) {
    return response
      .replace(/\*([^*]+)\*/g, '$1') // Remove italics emphasis
      .replace(/"([^"]+)"/g, '$1') // Remove sarcastic quotes
      .replace(/\.\.\./g, '.') // Remove dramatic pauses
      .replace(/\s+😏|\s+🙄|\s+😤/g, ''); // Remove sassy emojis
  }

  /**
   * Generate context-aware personality
   */
  generateContextAwareResponse(context, sassLevel) {
    const { primaryLanguage, framework, projectType } = context;

    let contextResponse = '';

    // Language-specific sass
    const languageSass = {
      javascript:
        "Ah, JavaScript - where everything is awesome until it isn't.",
      python: 'Python, eh? At least someone has good taste in languages.',
      java:
        "Java... because apparently we love typing 'public static void' repeatedly.",
      php:
        'PHP? Brave choice. I respect the dedication to... interesting decisions.'
    };

    if (languageSass[primaryLanguage] && sassLevel >= 6) {
      contextResponse += languageSass[primaryLanguage] + ' ';
    }

    // Framework-specific sass
    const frameworkSass = {
      react: 'React hooks have you hooked, I see.',
      angular:
        'Angular - because sometimes you just want to over-engineer everything.',
      vue: 'Vue.js - the reasonable choice. I approve.',
      express: 'Express.js - keeping it simple, I like that.'
    };

    if (frameworkSass[framework] && sassLevel >= 6) {
      contextResponse += frameworkSass[framework] + ' ';
    }

    return contextResponse;
  }

  /**
   * Generate personality summary for user
   */
  getPersonalitySummary(sassLevel) {
    const level = this.sassLevels[sassLevel] || this.sassLevels[5];

    return {
      level: sassLevel,
      name: level.name,
      tone: level.tone,
      helpfulness: level.helpfulness,
      description: this.getPersonalityDescription(sassLevel)
    };
  }

  /**
   * Get personality description
   */
  getPersonalityDescription(sassLevel) {
    const descriptions = {
      1: 'Professional and polite, focused on being helpful without any attitude.',
      3: 'Friendly with occasional mild sarcasm, still very helpful.',
      5: 'Moderately sassy with witty comments, balanced with helpfulness.',
      7: 'Quite sassy and sarcastic, but still gets the job done.',
      10: 'Maximum sass mode - brutally honest about vague requests but still provides solutions.'
    };

    const closestLevel = Object.keys(descriptions)
      .map(Number)
      .reduce(
        (prev, curr) =>
          Math.abs(curr - sassLevel) < Math.abs(prev - sassLevel) ? curr : prev
      );

    return descriptions[closestLevel];
  }
}

module.exports = new PersonalityEngine();
