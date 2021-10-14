package com.orchestranetworks.ps.admin.devartifacts.util;

import java.io.*;
import java.util.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.ps.admin.devartifacts.constants.*;
import com.orchestranetworks.ps.procedure.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

/**
 * Contains utility methods for use with Dev Artifacts
 */
public abstract class DevArtifactsUtil
{
	/**
	 * Execute a {@link DevArtifactsProcedure} and throw the resulting {@link DevArtifactsException} if one was generated.
	 * This is equivalent to calling {@link ProcedureExecutor#executeProcedure(Procedure, Session, AdaptationHome)},
	 * and if an exception occurs, checking {@link DevArtifactsProcedure#getException()} and throwing that instead of
	 * the exception. If it's <code>null</code>, then simply rethrow the exception.
	 * 
	 * This is all because normally invoking a procedure, everything gets wrapped in an OperationException, so you won't
	 * be able to get the Dev Artifacts specific details.
	 * 
	 * @param procedure the procedure
	 * @param session the session
	 * @param dataSpace the data space
	 * @throws DevArtifactsException if the procedure created a DevArtifactsException
	 * @throws OperationException if the procedure threw an OperationException
	 */
	public static void executeProcedure(
		DevArtifactsProcedure procedure,
		Session session,
		AdaptationHome dataSpace)
		throws DevArtifactsException, OperationException
	{
		try
		{
			ProcedureExecutor.executeProcedure(procedure, session, dataSpace);
		}
		catch (OperationException ex)
		{
			DevArtifactsException devArtifactsException = procedure.getDevArtifactsException();
			if (devArtifactsException != null)
			{
				throw devArtifactsException;
			}
			throw ex;
		}
	}

	/**
	 * Read the XML files from the given folder to get a list of workflow model names
	 * 
	 * @param folder the folder containing workflow model XML files
	 * @return the list of workflow model names
	 */
	public static List<String> getWorkflowsFromFolder(File folder)
	{
		return getArtifactsFromFolder(
			folder,
			new DevArtifactsFilenameFilter(DevArtifactsConstants.WORKFLOW_PREFIX, ".xml"));
	}

	/**
	 * Get the names of artifacts from the given folder that match the given filter
	 * 
	 * @param folder the folder
	 * @param filenameFilter the filename filter
	 * @return the list of artifact names
	 */
	public static List<String> getArtifactsFromFolder(
		File folder,
		DevArtifactsFilenameFilter filenameFilter)
	{
		if (folder.exists())
		{
			// Get all filenames that match the filter
			String[] filenames = folder.list(filenameFilter);
			if (filenames == null || filenames.length == 0)
			{
				return new ArrayList<>();
			}
			ArrayList<String> artifacts = new ArrayList<>();
			for (String filename : filenames)
			{
				// Take off the prefix and the suffix to get artifact name
				String artifact = filename.substring(
					filenameFilter.getPrefix().length(),
					filename.length() - filenameFilter.getSuffix().length());
				artifacts.add(artifact);
			}
			Collections.sort(artifacts);
			return artifacts;
		}
		return new ArrayList<>();
	}

	/**
	 * Export a table as XML
	 * 
	 * @param pContext the procedure context
	 * @param table the table
	 * @param exportSpec the export spec to the file
	 * @param lineSeparator the line separator to use
	 * @param predicate the predicate to apply to the table, or <code>null</code>.
	 *                  (If specified, will take precedence over <code>filter</code>.)
	 * @param filter the programmatic filter to apply to the table, or <code>null</code>
	 * @throws OperationException if there was an exception
	 */
	public static void exportTable(
		ProcedureContext pContext,
		AdaptationTable table,
		final ExportSpec exportSpec,
		final String lineSeparator,
		String predicate,
		AdaptationFilter filter)
		throws OperationException
	{
		Request request = table.createRequest();
		if (predicate == null)
		{
			if (filter != null)
			{
				request.setSpecificFilter(filter);
			}
		}
		else
		{
			request.setXPathFilter(predicate);
		}
		exportSpec.setRequest(request);

		doExport(pContext, exportSpec, lineSeparator);
	}

	/**
	 * Perform an export of the given spec
	 * 
	 * @param pContext the procedure context
	 * @param spec the spec
	 * @param lineSeparator the line separator
	 * @throws OperationException if an exception occurs while executing
	 */
	public static void doExport(ProcedureContext pContext, ExportSpec spec, String lineSeparator)
		throws OperationException
	{
		boolean allPrivileges = pContext.isAllPrivileges();
		pContext.setAllPrivileges(true);
		try
		{
			pContext.doExport(spec);
		}
		finally
		{
			pContext.setAllPrivileges(allPrivileges);
		}
		if (!System.getProperty("line.separator").equals(lineSeparator))
		{
			try
			{
				convertLineSeparator(spec.getDestinationFile(), lineSeparator);
			}
			catch (IOException ex)
			{
				throw OperationException.createError("Error converting line separator.", ex);
			}
		}
	}

	/**
	 * Create an XML export spec for the given folder & filename
	 * 
	 * @param folder the folder to export to
	 * @param filename the filename, without the extension
	 * @return the export spec
	 */
	public static ExportSpec createExportSpec(File folder, String filename)
	{
		ExportSpec spec = new ExportSpec();
		spec.setIncludesTechnicalData(false);
		spec.setIncludesComputedValues(false);
		spec.setOmitXMLComment(true);
		File destFile = new File(folder, filename + ".xml");
		spec.setDestinationFile(destFile);
		return spec;
	}

	/**
	 * Find whether the given module should be considered part of the tenant
	 * 
	 * @param tenantPolicy the tenant policy
	 * @param tenantModules the tenant's modules
	 * @param moduleName the module
	 * @return whether the module is part of the tenant
	 */
	public static boolean matchesTenantModule(
		String tenantPolicy,
		List<String> tenantModules,
		String moduleName)
	{
		// For multi-admin, it matches when there's no module or it's a built-in ebx module
		if (DevArtifactsConstants.TENANT_POLICY_MULTI_ADMIN.equals(tenantPolicy)
			&& (moduleName == null || moduleName.startsWith("ebx-")))
		{
			return true;
		}
		// For both multi and multi-admin, include if module matches
		return tenantModules.contains(moduleName);
	}

	/**
	 * Follow a chain of foreign keys from the given records.
	 * This simply invokes {@link AdaptationUtil#followFK(Adaptation, Path) until it gets a
	 * <code>null</code> or reaches the end of the foreign key array.
	 * If no paths are specified, will simply return the given record.
	 * 
	 * @param foreignKeyPaths the foreign key paths
	 * @param record the record to start with
	 * @return the resulting foreign record
	 */
	public static Adaptation followForeignKeyChain(Path[] foreignKeyPaths, Adaptation record)
	{
		Adaptation returnVal = record;
		if (foreignKeyPaths != null && foreignKeyPaths.length > 0)
		{
			for (int i = 0; returnVal != null && i < foreignKeyPaths.length; i++)
			{
				returnVal = AdaptationUtil.followFK(returnVal, foreignKeyPaths[i]);
			}
		}
		return returnVal;
	}

	// Read the file line by line into a buffer and then write it out again,
	// replacing the line separator
	private static void convertLineSeparator(File file, String lineSeparator) throws IOException
	{
		BufferedReader reader = new BufferedReader(new FileReader(file));
		StringBuilder bldr = new StringBuilder();
		try
		{
			for (String line; (line = reader.readLine()) != null;)
			{
				bldr.append(line);
				bldr.append(lineSeparator);
			}
		}
		finally
		{
			reader.close();
		}

		BufferedWriter writer = new BufferedWriter(new FileWriter(file));
		try
		{
			writer.write(bldr.toString());
			writer.flush();
		}
		finally
		{
			writer.close();
		}
	}

	/**
	 * Get the log to use with Dev Artifacts. The return value should not be stored in a static variable,
	 * per the suggestion in {@link LoggingCategory}. Rather, this method should be called each time a
	 * message needs to be written.
	 * 
	 * @return the log
	 */
	public static LoggingCategory getLog()
	{
		return LoggingCategory.getKernel();
	}
}
