@Override
	public void handleSearchRegistration(ModuleSearchRegistrationContext aContext)
	{

		ModuleSearchRegistrationAddonContext context = (ModuleSearchRegistrationAddonContext) aContext;

		//Define the synonym list as pairs of synonyms.
		List<SynonymPair> customSynonyms = Arrays
			.asList(SynonymPair.newPair("quick", "fast"), SynonymPair.newPair("quick", "rapid"));

		//Define the list of stopwords.
		List<String> customStopwords = Arrays.asList("street", "boulevard", "city");

		//Register the custom template and any lists of synonyms, or stopwords
		//The SynonymKey and StopWordsKey arguments must begin with the name of your custom module followed by '@' and the value you choose.
		//You pass these key values as parameters when configuring a field's search strategy.
		context.registerSearchTemplate(MyCustomTemplate::new)
			.registerSynonyms(
				SynonymDeclaration.of(
					SynonymsKey.parse("ebx-addon-docs@customSynonyms"),
					UserMessage.createInfo("User message 1 String"),
					UserMessage.createInfo("User message 2 String")),
				customSynonyms)
			.registerStopWords(
				StopWordsDeclaration.of(
					StopWordsKey.parse("ebx-addon-docs@customStopwords"),
					UserMessage.createInfo("User message 3"),
					UserMessage.createInfo("User Message 4")),
				customStopwords);
	}
