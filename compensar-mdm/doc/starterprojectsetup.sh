#!/bin/bash
# description: Customer Starter Project Setup


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
# /Users/frankkoh/Projects/PSWorkspace/psworkspace /Users/frankkoh/Projects/AcadianPOCWorkspace acadian-mdm BEMD businessentity BusinessEntity acadian.mdm Acadian acadian

# to set permissions from within the folder containing the script:  chmod 755 starterprojectsetup.sh

echo "*** Setup started ***"

#cd $1
cp -R $1 $2
cd $2
rm -rf .git
mv compensar-mdm $3
cd $3

echo "* Changes in compensar-mdm *"

# find and replace string within files recursively
export LC_CTYPE=C
export LANG=C

echo "- Find and replace occurrences of compensar-mdm with "$3" within the files recursively"
grep -rli 'compensar-mdm' * | xargs -I@ sed -i '' -e 's/compensar-mdm/'$3'/g' @

echo "- Find and replace occurrences of PERS with "$4" within the files recursively"
grep -rli 'PERS' * | xargs -I@ sed -i '' -e 's/PERS/'$4'/g' @

echo "- Find and replace occurrences of pers with "$5" within the files recursively"
grep -rli 'pers' * | xargs -I@ sed -i '' -e 's/pers/'$5/'g' @

# replacing pers with customer will also replace the <domain> tags in the Perspective artifact files. The below statement is executed to negate that.
#grep -rli '<customer>' * | xargs -I@ sed -i '' -e 's/<customer>/<domain>/g' @
grep -rli $5'>' * | xargs -I@ sed -i '' -e 's/'$5'>/domain>/g' @

echo "- Find and replace occurrences of Pers with "$6" within the files recursively"
grep -rli 'Pers' * | xargs -I@ sed -i '' -e 's/Pers/'$6'/g' @

echo "- Find and replace occurrences of pers.mdm with "$7" within the files recursively. This is for the package structure defined within the java files"
grep -rli 'pers.mdm' * | xargs -I@ sed -i '' -e 's/pers.mdm/'$7'/g' @

echo "- Find and replace occurrences of Pers with "$8" within the files recursively. This is for PersDevArtifactsServiceMain and PersModuleRegistrationListener class names within the java files"
grep -rli 'Pers' * | xargs -I@ sed -i '' -e 's/Pers/'$8'/g' @


# rename the file names
echo "- Find and replace occurrences of Pers with "$8" in the file names"
find . -name '*Pers*' -exec bash -c 'mv $0 ${0/Pers/'$8'}' {} \;

echo "- Find and replace occurrences of Pers with "$6" in the file names"
find . -name '*Pers*' -exec bash -c 'mv $0 ${0/Pers/'$6'}' {} \;

echo "- Find and replace occurrences of pers with "$5" in the file names"
find . -name '*pers*' -exec bash -c 'mv $0 ${0/pers/'$5'}' {} \;

echo "- Find and replace occurrences of PERS with "$4" in the file names"
find . -name '*PERS*' -exec bash -c 'mv $0 ${0/PERS/'$4'}' {} \;


# rename folder names
echo "- Find and replace occurrences of company with "$9" in the folder names"
find . -depth -type d -name 'company' -execdir mv {} ''$9'' \;

echo "- Find and replace occurrences of pers with "$5" in the folder names"
find . -depth -type d -name 'pers' -execdir mv {} ''$5'' \;

# rename compensar-mdm in the .project file
echo "- Rename compensar-mdm in the .project file with "$3
sed -i '' -e 's/compensar-mdm/'$3'/g' .project


# Changes in EBX Server
echo "* Changes in EBX Server *"
cd ../EBX\ Server/
echo "- Find and replace occurrences of compensar-mdm with "$3" within the files recursively"
grep -rli 'compensar-mdm' * | xargs -I@ sed -i '' -e 's/compensar-mdm/'$3'/g' @

# Changes in EBX Home
echo "* Changes in EBX Server *"
cd ../EBX\ Home/
echo "- Delete the existing h2 repository from EBX Home"
rm -rf ebxRepository/h2/repository.h2.db

echo "*** Setup completed ***"
exit 0
