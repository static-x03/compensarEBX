package com.orchestranetworks.ps.logging;

import java.io.*;
import java.util.*;

import com.onwbp.base.misc.*;
import com.onwbp.org.apache.log4j.*;
import com.orchestranetworks.ps.constants.*;

public class CustomLogger
{
	//	@SuppressWarnings("unused")
	private static CustomLogger customLogger = new CustomLogger();
	private Category category;

	public static Category newInstance()
	{
		return customLogger.category;
	}

	private CustomLogger()
	{
		try
		{
			Properties props = CommonConstants.getEBXProperties();

			String categoryName = props.getProperty(
				LoggingConstants.LOGGING_CATEGORY_NAME_PROPERTY,
				LoggingConstants.CATEGORY_DEFAULT_NAME);

			String logFilename = props.getProperty(LoggingConstants.LOGGING_FILE_NAME_PROPERTY);
			String treshold = props.getProperty(LoggingConstants.LOGGING_THRESHOLD_PROPERTY);
			String layout = props.getProperty(LoggingConstants.LOGGING_LAYOUT_PROPERTY);

			String appenderType = props.getProperty(LoggingConstants.LOGGING_APPENDER_TYPE);

			if (StringUtils.isEmpty(appenderType))
			{
				appenderType = "File";
			}

			Appender appender = null;
			PatternLayout patterLayout = StringUtils.isEmpty(layout)
				? new PatternLayout("%d %-5p [%c{1}] %m%n")
				: new PatternLayout(layout);

			String ebxLogFolder = props.getProperty(LoggingConstants.EBX_LOG_DIRECTORY_PROPERTY);

			String fileName = StringUtils.isEmpty(logFilename)
				? LoggingConstants.LOGGING_DEFAULT_FILE_NAME
				: logFilename;

			if (!StringUtils.isEmpty(ebxLogFolder))
			{
				fileName = StringUtils
					.replace(ebxLogFolder, "${ebx.home}", CommonConstants.getEBXHome())
					.concat(File.separator)
					.concat(fileName);
			}

			Priority priority = StringUtils.isEmpty(treshold) ? Priority.INFO
				: Priority.toPriority(treshold);

			String dailyRollOverDateTimePattern = props
				.getProperty(LoggingConstants.LOGGING_ROLLOVER_DATETIME_PATTERN);
			if (StringUtils.isEmpty(dailyRollOverDateTimePattern))
			{
				dailyRollOverDateTimePattern = "\'.\'yyyy-MM-dd";
			}

			category = Category.getInstance(categoryName);
			if (LoggingConstants.APPENDER_FILE.equalsIgnoreCase(appenderType))
			{
				DailyRollingFileAppender fileAppender = new DailyRollingFileAppender();
				fileAppender.setFile(fileName);
				fileAppender.setLayout(patterLayout);
				fileAppender.setThreshold(priority);
				fileAppender.setAppend(true);
				fileAppender.activateOptions();
				fileAppender.setDatePattern(dailyRollOverDateTimePattern);
				appender = fileAppender;
			}
			else
			{
				ConsoleAppender consoleAppender = new ConsoleAppender();
				consoleAppender.setName(categoryName);
				consoleAppender.setThreshold(priority);
				consoleAppender.setLayout(patterLayout);
				appender = consoleAppender;
			}

			category.addAppender(appender);
			category.setPriority(Priority.toPriority(treshold));
		}
		catch (Exception ex)
		{
			throw new RuntimeException(ex);
		}
	}

	public boolean isDebug()
	{
		return customLogger.category.isDebugEnabled();
	}

	public void debug(String message)
	{
		if (customLogger.category.isDebugEnabled())
		{
			customLogger.category.debug(message);
		}
	}

	public void debug(String message, Exception exp)
	{
		if (customLogger.category.isDebugEnabled())
		{
			customLogger.category.debug(message, exp);
		}
	}

	public void info(String message)
	{
		if (customLogger.category.isInfoEnabled())
		{
			customLogger.category.info(message);
		}
	}

	public void info(String message, Exception exp)
	{
		if (customLogger.category.isInfoEnabled())
		{
			customLogger.category.info(message, exp);
		}
	}

}
