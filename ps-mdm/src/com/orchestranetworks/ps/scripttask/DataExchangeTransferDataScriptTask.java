package com.orchestranetworks.ps.scripttask;

import java.util.*;

import org.apache.commons.lang3.*;

import com.onwbp.adaptation.*;
import com.onwbp.base.text.*;
import com.orchestranetworks.addon.dataexchange.transformation.*;
import com.orchestranetworks.addon.dex.*;
import com.orchestranetworks.addon.dex.common.generation.*;
import com.orchestranetworks.addon.dex.configuration.*;
import com.orchestranetworks.addon.dex.mapping.*;
import com.orchestranetworks.addon.dex.result.*;
import com.orchestranetworks.instance.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;
import com.orchestranetworks.workflow.*;

/**
 * <pre>{@code
		<bean className="com.orchestranetworks.ps.scripttask.DataExchangeTransferDataScriptTask">
		    <documentation xml:lang="en-US">
				<label>Data Exchange Transfer Data</label>
				<description>
					Script Task to Transfer data between tables with the given parameters using Data Exchange
				</description>
			</documentation>
			<properties>
		          <property name="dataSpaceName" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Source Dataspace id</label>
		                  <description>
		                     Source dataspace. 
		                  </description>
		              </documentation>
		          </property>
		          <property name="dataSetName" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Source Dataset</label>
		                  <description>
		                     Source Dataset
		                  </description>
		              </documentation>
		          </property>
		          
		          <property name="targetDataSpaceName" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Target Dataspace id</label>
		                  <description>
		                     Target Dataspace
		                  </description>
		              </documentation>
		          </property>
		          <property name="targetDataSetName" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Target Dataset id</label>
		                  <description>
		                     Target Dataset
		                  </description>
		              </documentation>
		          </property>
		          <property name="sourceTargetTablePaths" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Source, Target tables path</label>
		                  <description>
		                     Comma delimited for Source and Target Table path and semicolon delimiter for each pair		
		                     /root/sourceTable1,/root/targetTable1;/root/sourceTable2,/root/targetTable2
		                  </description>
		              </documentation>
		          </property>
		          
		          <property name="sourceApplicationLogicalName" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Source application logical name</label>
		                  <description>
		                     Name of an application to be used as Source from the Data Exchange configuration.
		                  </description>
		              </documentation>
		          </property>
		          <property name="targetApplicationLogicalName" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Target application logical name</label>
		                  <description>
		                     Name of an application to be used as Target from the Data Exchange configuration.
		                  </description>
		              </documentation>
		          </property>
		          <property name="importMode" input="true">
		              <documentation xml:lang="en-US">
		                  <label>Transfer operation mode</label>
				<description>
				   Defines the mode for transferring the data. option are "UPDATE_AND_INSERT" (default), "INSERT_ONLY", "UPDATE_ONLY", "REPLACE_ALL_CONTENT", "UNKNOWN". 
				</description>
		              </documentation>
		          </property>          
		      </properties>
		</bean>
		
		}</pre>
 * @author mickaelgermemont
 *
 */
public class DataExchangeTransferDataScriptTask extends ScriptTaskBean
{
	private String sourceApplicationLogicalName;
	private String targetApplicationLogicalName;
	private String dataSpaceName;
	private String dataSetName;

	private String targetDataSpaceName;
	private String targetDataSetName;

	/**
	 * example: 
	 * /root/sourceTable1,/root/targetTable1;/root/sourceTable2,/root/targetTable2
	 */
	private String sourceTargetTablePaths;

	private String delimiter = DEFAULT_DELIMITER;
	private String tablePairDelimiter = DEFAULT_TABLE_PAIR_DELIMITER;
	private ImportMode importModeEnum = ImportMode.UPDATE_AND_INSERT;

	private static final String DEFAULT_DELIMITER = ",";
	private static final String DEFAULT_TABLE_PAIR_DELIMITER = ";";

	@Override
	public void executeScript(ScriptTaskBeanContext context) throws OperationException
	{
		try
		{
			Repository repository = context.getRepository();
			AdaptationHome dataSpace = AdaptationUtil
				.getDataSpaceOrThrowOperationException(repository, dataSpaceName);
			Adaptation dataSet = AdaptationUtil
				.getDataSetOrThrowOperationException(dataSpace, dataSetName);

			com.orchestranetworks.addon.dex.DataExchangeSpec dataExchangeSpec = new com.orchestranetworks.addon.dex.DataExchangeSpec();

			AdaptationHome targetDataSpace = AdaptationUtil
				.getDataSpaceOrThrowOperationException(repository, targetDataSpaceName);
			Adaptation targetDataSet = AdaptationUtil
				.getDataSetOrThrowOperationException(targetDataSpace, targetDataSetName);

			Map<String, String> parsedSourceTargetTablePaths = getParsedSourceTargetTablePaths();
			if (parsedSourceTargetTablePaths.isEmpty())
			{
				throw OperationException
					.createError("sourceTargetTablePaths cannot be null or empty string.");
			}

			TableMappingList<EBXField, EBXField> tableMappingList = new TableMappingList<>();
			Set<Path> sourceTablePaths = new LinkedHashSet<>();

			for (Iterator<Map.Entry<String, String>> iter = parsedSourceTargetTablePaths.entrySet()
				.iterator(); iter.hasNext();)
			{
				Map.Entry<String, String> entry = iter.next();
				// add the source table paths to generate the source EBX tables for the Transfer Config
				sourceTablePaths.add(Path.parse(entry.getKey()));
				// get the source and target adaptation table
				AdaptationTable sourceTable = dataSet.getTable(Path.parse(entry.getKey()));
				AdaptationTable targetTable = targetDataSet.getTable(Path.parse(entry.getValue()));
				// get the source and target EBX tables to create a TableMappingList to be used in the applicationMapping
				EBXTable srcEBXTable = new EBXTable(sourceTable);
				EBXTable targetEBXTable = new EBXTable(targetTable);
				tableMappingList.add(new TableMapping<>(srcEBXTable, targetEBXTable));
			}

			CommonApplication sourceApplication = new CommonApplication(
				getSourceApplicationLogicalName(),
				ApplicationType.EBX);
			CommonApplication targetApplication = new CommonApplication(
				getTargetApplicationLogicalName(),
				ApplicationType.EBX);

			EBXTableGeneration genTable = TableGenerationFactory.getEBXTableGeneration();
			TableGenerationResult<EBXField, EBXTable> genTableResult = genTable
				.generateTables(dataSet, sourceTablePaths, context.getSession());
			List<EBXTable> sourceEBXTables = genTableResult.getTables();

			TransferConfigurationSpec transferConfig = new TransferConfigurationSpec(
				dataSet,
				sourceEBXTables,
				targetDataSet,
				context.getSession());
			transferConfig.setImportMode(importModeEnum);

			ApplicationMapping<EBXField, EBXField> applicationMapping = ApplicationMappingHelperFactory
				.getApplicationMappingForTransferHelper()
				.getApplicationMapping(
					transferConfig,
					sourceApplication,
					targetApplication,
					tableMappingList);

			dataExchangeSpec.setApplicationMapping(applicationMapping);
			dataExchangeSpec.setConfigurationSpec(transferConfig);
			DataExchangeResult transferResults = DataExchangeServiceFactory.getDataExchangeService()
				.execute(dataExchangeSpec);
			StringBuilder resultMessage = new StringBuilder();

			for (@SuppressWarnings("unchecked")
			Iterator<TransferResult> iterator = (Iterator<TransferResult>) transferResults
				.getResults(); iterator.hasNext();)
			{
				Result result = iterator.next();
				// iterate the errors and build a string with them. later throw it an an operational exception
				for (UserMessage userMessage : result.getErrorMessages().values())
				{
					resultMessage.append(userMessage.formatMessage(Locale.getDefault()))
						.append("\n");

				}

				// iterating the warnings and logging them to the kernel log.
				for (Iterator<UserMessage> iterator2 = result.getWarningMessages(); iterator2
					.hasNext();)
				{
					UserMessage warningMessage = iterator2.next();
					LoggingCategory.getKernel().warn(warningMessage);
				}

			}

			if (resultMessage.length() > 0)
			{
				throw OperationException.createError(resultMessage.toString());
			}

		}
		catch (Exception e)
		{
			throw OperationException.createError(e);
		}

	}

	private Map<String, String> getParsedSourceTargetTablePaths()
	{
		Map<String, String> parsedSourceTargetTablePaths = new HashMap<>();

		if (StringUtils.isEmpty(sourceTargetTablePaths))
		{
			return parsedSourceTargetTablePaths;
		}

		String[] sourceTargetTablePathPairs = sourceTargetTablePaths.split(tablePairDelimiter);
		if (sourceTargetTablePathPairs != null)
		{
			for (int i = 0; i < sourceTargetTablePathPairs.length; i++)
			{
				String[] sourceTargetTablePathPair = sourceTargetTablePathPairs[i].split(delimiter);
				if (sourceTargetTablePathPair != null && sourceTargetTablePathPair.length == 2)
				{
					String sourceTablePath = sourceTargetTablePathPair[0];
					String targetTablePath = sourceTargetTablePathPair[1];
					parsedSourceTargetTablePaths.put(sourceTablePath, targetTablePath);
				}
			}
		}

		return parsedSourceTargetTablePaths;
	}

	public String getSourceApplicationLogicalName()
	{
		return sourceApplicationLogicalName;
	}

	public void setSourceApplicationLogicalName(String sourceApplicationLogicalName)
	{
		this.sourceApplicationLogicalName = sourceApplicationLogicalName;
	}

	public String getTargetApplicationLogicalName()
	{
		return targetApplicationLogicalName;
	}

	public void setTargetApplicationLogicalName(String targetApplicationLogicalName)
	{
		this.targetApplicationLogicalName = targetApplicationLogicalName;
	}

	public String getDataSpaceName()
	{
		return dataSpaceName;
	}

	public void setDataSpaceName(String dataSpaceName)
	{
		this.dataSpaceName = dataSpaceName;
	}

	public String getDataSetName()
	{
		return dataSetName;
	}

	public void setDataSetName(String dataSetName)
	{
		this.dataSetName = dataSetName;
	}

	public String getTableXPath()
	{
		// in order to not break existing integrations
		return "";
	}

	public void setTableXPath(String tableXPath)
	{
		// in order to not break existing integrations
	}

	public String getTargetDataSpaceName()
	{
		return targetDataSpaceName;
	}

	public void setTargetDataSpaceName(String targetDataSpaceName)
	{
		this.targetDataSpaceName = targetDataSpaceName;
	}

	public String getTargetDataSetName()
	{
		return targetDataSetName;
	}

	public void setTargetDataSetName(String targetDataSetName)
	{
		this.targetDataSetName = targetDataSetName;
	}

	public String getSourceTargetTablePaths()
	{
		return sourceTargetTablePaths;
	}

	public void setSourceTargetTablePaths(String sourceTargetTablePaths)
	{
		this.sourceTargetTablePaths = sourceTargetTablePaths;
	}

	public String getDelimiter()
	{
		return delimiter;
	}

	public void setDelimiter(String delimiter)
	{
		this.delimiter = delimiter;
	}

	public String getTablePairDelimiter()
	{
		return tablePairDelimiter;
	}

	public void setTablePairDelimiter(String tablePairDelimiter)
	{
		this.tablePairDelimiter = tablePairDelimiter;
	}

	public String getImportMode()
	{
		return getImportModeEnum().getValue();
	}

	public void setImportMode(String importMode)
	{
		if (!StringUtils.isEmpty(importMode))
		{
			this.importModeEnum = ImportMode.valueOf(importMode);
		}

	}

	public ImportMode getImportModeEnum()
	{
		return importModeEnum;
	}

}
