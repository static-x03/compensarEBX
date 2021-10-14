package com.orchestranetworks.ps.customDirectory;

import java.util.*;
import java.util.AbstractMap.*;

import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

public class TestExternalDirectory
{

	private static PropertiesFileListener propertyLoader;
	private static ExternalDirectory extDir = null;

	/**
	 * @param args Command line options
	 * Usage:
	 *   java -jar <jarName> [-v] [-p <directory.properties>] [-s <server.id>] <user> <password> [group[/desc]] .. [groupn[/descn]]
	 * Interactive mode:
	 *   java -jar <jarName> [-v] [-p <directory.properties>] [-s <server.id>] -i");
	 * 
	 */

	public static void main(String[] args)
	{

		int arg = 0;
		String propPath = null;
		String serverId = null;

		if (args.length > 2)
		{
			if ("-v".equals(args[arg]))
			{
				arg++;
				System.setProperty("org.apache.commons.logging.simplelog.defaultlog", "trace");
			}
			else
			{
				System.setProperty("org.apache.commons.logging.simplelog.defaultlog", "debug");
			}
			if ((args.length > (arg + 2)) && "-p".equals(args[arg]))
			{
				arg++;
				propPath = args[arg++];
			}
			if ((args.length > (arg + 2)) && "-s".equals(args[arg]))
			{
				arg++;
				serverId = args[arg++];
			}
		}
		System.setProperty("org.apache.commons.logging.simplelog.showlogname", "false");
		System.setProperty("org.apache.commons.logging.simplelog.showShortLogname", "false");
		System.setProperty("org.apache.commons.logging.simplelog.showdatetime", "false");
		System.setProperty("org.apache.commons.logging.simplelog.dateTimeFormat", "HH:mm:ss");

		if (args.length < (1 + arg))
		{
			System.out.println(
				"Usage:\n java -jar <jarName> [-v] [-p <directory.properites>] [-s <server.id>] [-i]"
					+ " <user> <password> [group[/desc]] .. [groupn[/descn]]");
			System.out.println(
				"Interactive mode: java -jar <jarName> [-v] [-p <directory.properites>] [-s <server.id>] [-i]");
			return;
		}

		if (propPath == null)
			propPath = System.getProperty("ebx.properties", "ebx.properties");
		propertyLoader = PropertiesFileListener.getPropertyLoader(propPath);
		System.out.println("Loading " + propPath);

		// Check config to see if external directory is set up
		String extDirProp = propertyLoader.getProperty("ebx.directory.factory");
		if (extDirProp == null)
		{
			System.out.println("EBX properties do not define external directory.");
			return;
		}
		try
		{
			extDir = (ExternalDirectory) Class.forName(extDirProp).newInstance();
		}
		catch (Exception e)
		{
			System.out.println("Could not create directory " + extDirProp + ".");
			return;
		}
		extDir.updateDirProperties(propertyLoader);

		ExternalDirectoryConfig extDirConfig = extDir
			.getExternalDirectoryConfigForServerId(serverId);

		if (args[arg].equalsIgnoreCase("-i"))
		{
			extDir.interact(extDirConfig);
			return;
		}

		String user = args[arg++];
		String cred = "";
		if (arg < args.length)
			cred = args[arg++];
		System.out.println("Connecting to external directory.");
		if (extDir.authenticateLogin(user, cred, extDirConfig) == null)
		{
			System.out.println("User password denied for '" + user + "' .");
		}
		else
		{
			System.out.println("Mapped User Attributes:");
			User userObject = new User();
			userObject.setUserReference(UserReference.forUser(user));
			Map<Path, String> prof = extDir.updateUserProfile(userObject, null);
			if (prof == null)
			{
				System.out.println("Could not fetch user Attributes.");
			}
			else if (prof.size() == 0)
			{
				System.out.println("No user Attributes found.");
			}
			else
			{
				for (Path p : prof.keySet())
				{
					System.out.println(p.format() + " <== " + prof.get(p));
				}
			}
		}
		System.out.println("All User Attributes:");
		List<SimpleEntry<String, String>> attr = extDir.getUserInfo(user, extDirConfig);
		if (attr == null)
		{
			System.out.println("Could not fetch user Attributes.");
		}
		else if (attr.size() == 0)
		{
			System.out.println("No user Attributes found.");
		}
		else
		{
			for (SimpleEntry<String, String> at : attr)
			{
				System.out.println(at.getKey() + " <== " + at.getValue());
			}
		}
		printMembership(user, "administrator", "administrators");
		printMembership(user, "read-only", "read-only users");
		for (int i = arg; i < args.length; i++)
		{
			int j = args[i].indexOf('/');
			if (j >= 0)
				printMembership(user, args[i].substring(0, j), args[i].substring(j + 1));
			else
				printMembership(user, args[i], null);
		}
	}

	private static void printMembership(String user, String roleName, String roleLabel)
	{
		String desc;
		if (roleLabel != null)
			desc = " a member of " + roleLabel + "(" + roleName + ")";
		else
			desc = " a member of group " + roleName;
		User userObject = new User();
		userObject.setUserReference(UserReference.forUser(user));
		Boolean isMember = extDir.isUserInRole(userObject, roleName, roleLabel);
		if (isMember != null)
			System.out
				.println("User " + user + (isMember.booleanValue() ? " is" : " is not") + desc);
	}
}
