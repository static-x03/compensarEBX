# specify the following parameters:
#   1) Full Path to the Starter Project Workspace
#   2) Full Path to where the Target Project Workspace should be created
#   3) The desired name for the Customer's Project in Eclipse  (will replace "compensar-mdm" in the Starter Project)
#   4) The 4 letter acronym for the Project Pers  (will replace the "PERS" prefix in the Starter Project)
#   5) The lower case name for the java package node for that Pers (will replace the "pers" package node in the Starter Project)
#   6) The Camel case name for the pers which will be used for Artifact naming that contains the actual Pers Name (will replace the word "Pers" used for Data Model Names, etc in the Starter Project)
#   7) The lower case name for the java package node for that customer (will replace the "pers.mdm" package node in the Starter Project)
#   8) The Camel case name for the Pers (will replace the "Pers" text in the Starter Project)
#   9) The lower case name for the company (will replace the "company" text in the Starter Project)

# Examples:
# /Users/Bala/Documents/ON_Docs/EBX/StarterWorkspace/psworkspace/ /Users/Bala/Documents/ON_Docs/EBX/StarterWorkspace/CustomerWorkspace customer-mdm LOCN location Location customer.mdm Customer customer
# /Users/frankkoh/Projects/PSWorkspace/psworkspace /Users/frankkoh/Projects/InspirePOCWorkspace inspire-mdm MENU menu Menu inspire.mdm Inspire inspire

# to set permissions from within the folder containing the script:  chmod 755 starterprojectsetup.sh

# Navigate to where the script is available and run the below command (with modified parameters)
# ./starterprojectsetup.sh /Users/Bala/Documents/ON_Docs/EBX/StarterWorkspace/psworkspace/ /Users/Bala/Documents/ON_Docs/EBX/StarterWorkspace/CustomerWorkspace customer-mdm LOCN location Location customer.mdm Customer customer

# After creating the starter project, open the workspace in eclipse, import the projects and start EBX using the "Start EBX" launch config
# When EBX starts for the first time, you will need to install the repository (following the Repository Installation wizard)
# Once EBX in up and running, go to Admin-->Directory-->Roles and create a role called "Tech Admin", grant the role to the "admin" user that you'd create during the repository installation
# Then, go to the Dataspace tab and run the Import Dev Artifacts service
